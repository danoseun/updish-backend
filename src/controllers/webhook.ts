import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import pool from '../config/database.config';
import { generateRandomCode, logger, respond } from '../utilities';
import { getLastOrderService } from './order';
import { sql } from '../database/sql';
import { verifyPayment } from '../services/flutterwave';
import { ORDER_STATUS } from '../constants';
import { emailSender } from '../utilities/email.utility';

interface WebhookData {
  tx_ref: string;
  amount: number;
  customer: {
    id: number;
    name: string;
    phone_number: string | null;
    email: string;
    created_at: string;
  };
}

export const WebHookController = {
  handleWebhook: (): RequestHandler => async (req, res) => {
    console.log('triggered ======>>>>');
    const { event, data } = req.body;
    const signature = req.headers['verif-hash']; // Header sent by Flutterwave
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const { tx_ref, amount, customer } = data as WebhookData;

    // Verify the signature
    if (!secretHash || !signature || signature !== secretHash) {
      return respond(res, { message: 'Invalid or missing signature' }, HttpStatus.UNAUTHORIZED);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch user
      const userResult = await client.query(`SELECT id FROM users WHERE email = $1`, [customer.email]);

      if (!userResult.rows.length) {
        return respond(res, { message: 'User not found' }, HttpStatus.NOT_FOUND);
      }
      const userId = userResult.rows[0].id;

      // Fetch active user plan
      const activePaymentPlanResult = await client.query(`SELECT * from payment_plans WHERE user_id = $1 AND status = 'active'`, [userId]);
      if (!activePaymentPlanResult.rows.length) {
        return respond(res, { message: 'No active user plan found' }, HttpStatus.NOT_FOUND);
      }
      const payment_plan_id = activePaymentPlanResult.rows[0].payment_plan_id;

      // It is recommended to re-verify transaction
      const verifyPaymentResponse = await verifyPayment(data.id);
      console.log('VERIFY RESPONSE INSIDE WEBHOOK', verifyPaymentResponse.data);

      if (event === 'charge.completed' && verifyPaymentResponse.data.status === 'successful') {
        // Check for existing pending subscription with the userId and transacction_ref
        const subscriptionResult = await client.query(
          `SELECT s.*, o.* 
           FROM subscriptions s
           LEFT JOIN orders o ON s.order_id = o.id
           WHERE s.user_id = $1 
           AND s.payment_plan_id = $2 
           AND transaction_ref = $3
           AND s.status = 'pending'`,
          [userId, payment_plan_id, tx_ref]
        );

        console.log('sub_rows==>>', subscriptionResult.rows);

        if (subscriptionResult.rows.length) {
          console.log('FIRST_TIMER====>>>');
          // this is a first timer, order and sub already created in create. Update status here
          // also for a user who updated the order. Sub and order already created in update handler.

          if (verifyPaymentResponse.data.amount === subscriptionResult.rows[0].total_price && verifyPaymentResponse.data.currency === 'NGN') {
            respond(res, { message: '' }, HttpStatus.OK);
          }

          const subscriptionId = subscriptionResult.rows[0].id;
          const orderId = subscriptionResult.rows[0].order_id;

          // Update order and subscription status
          await client.query(`UPDATE subscriptions SET status = 'paid' WHERE id = $1`, [subscriptionId]);

          await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [orderId]);

          // Notify customer(method needs to be added)
          await emailSender({
            subject: 'Welcome to Updish!',
            text: `Hello, ${userResult.rows[0].first_name}. Your payment has been confirmed and we will start working on getting your meals to you. Do enjoy them as they come! Updish!`,
            recipientMail: userResult.rows[0].email
          });
          // await sendNotification(customer.email, 'Payment Successful', 'Your subscription has been paid.');
        } else {
          console.log('RECURRING====>>>');
          // Handle new order creation for recurring subscription
          // Create new order, order_meals and subscription

          const orderCode = generateRandomCode();

          const lastCreatedOrderResult = await getLastOrderService(userId, ORDER_STATUS.IN_PROGRESS);

          if (verifyPaymentResponse.data.amount === lastCreatedOrderResult.order.total_price && verifyPaymentResponse.data.currency === 'NGN') {
            respond(res, { message: '' }, HttpStatus.OK);
          }

          const startDate = new Date(lastCreatedOrderResult.order.start_date);
          const newStartDate = new Date(startDate.setDate(startDate.getDate() + 7));
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newEndDate.getDate() + 7);

          const newOrderResult = await client.query(
            `INSERT INTO orders (user_id, start_date, end_date, payment_plan_id, number_of_meals, total_price, code, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
            [userId, newStartDate, newEndDate, payment_plan_id, lastCreatedOrderResult.order.number_of_meals, amount, orderCode, 'paid']
          );

          const newOrderId = newOrderResult.rows[0].id;

          // Insert updated meals
          for (const meal of lastCreatedOrderResult.meals) {
            const mealCode = generateRandomCode();
            const parsedMealDate = new Date(meal.date);
            const newMealDate = new Date(parsedMealDate.setDate(parsedMealDate.getDate() + 7));
            await client.query(sql.createOrderMeals, [
              newOrderId,
              newMealDate,
              meal.category,
              meal.bundle_id,
              meal.quantity,
              meal.delivery_time,
              meal.address,
              mealCode
            ]);
          }

          // Create a subscription
          await client.query(
            `INSERT INTO subscriptions (user_id, order_id, start_date, end_date, payment_plan_id, transaction_ref, total_price, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, newOrderId, newStartDate, newEndDate, payment_plan_id, tx_ref, amount, 'paid']
          );

          // Notify customer(needs to be added)
          await emailSender({
            subject: 'Updish Subscription Renewal!',
            text: `Hello, ${userResult.rows[0].first_name}. Your payment for the recurring meal plan subscription has been confirmed. Kindly go into the app and use this code ${orderCode} to update your meals. Enjoy!
            `,
            recipientMail: userResult.rows[0].email
          });
          // await sendNotification(customer.email, 'Subscription Created', 'Your new subscription has been created.');
        }
      } else {
        logger.info('Unhandled event type');
        return respond(res, { message: 'Unhandled event type' }, HttpStatus.BAD_REQUEST);
      }

      await client.query('COMMIT');
      logger.info('Webhook handled successfully');
      return respond(res, { message: 'Webhook handled successfully' }, HttpStatus.OK);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Webhook Handling Error:', error);
      respond(res, 'Failed to process webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      client.release();
    }
  }
};
