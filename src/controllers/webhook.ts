import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import pool from '../config/database.config';
import crypto from 'crypto';
import { generateRandomCode, respond } from '@src/utilities';
import { getLastOrderService } from './order';
import { sql } from '@src/database/sql';

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
    const { event, data } = req.body;
    const signature = req.headers['verif-hash']; // Header sent by Flutterwave
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH; // Set in environment variables
    const { tx_ref, amount, customer } = data as WebhookData;

    // Verify the signature
    if (!secretHash || !signature || signature !== crypto.createHash('sha256').update(secretHash).digest('hex')) {
      return res.status(401).json({ message: 'Invalid or missing signature' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch user
      const userResult = await client.query(`SELECT id FROM users WHERE email = $1`, [customer.email]);
      if (!userResult.rows.length) {
        await client.query('ROLLBACK');
        return respond(res, { message: 'User not found' }, HttpStatus.NOT_FOUND);
      }
      const userId = userResult.rows[0].id;

      // Fetch active user plan
      const activePaymentPlanResult = await client.query(`SELECT * from payment_plans WHERE user_id = $1`, [userId]);
      if (!activePaymentPlanResult.rows.length) {
        await client.query('ROLLBACK');
        return respond(res, { message: 'No active user plan found' }, HttpStatus.NOT_FOUND);
      }
      const payment_plan_id = activePaymentPlanResult.rows[0].id;

      if (event === 'charge.completed') {
        // Check for existing pending subscription with the userId
        const subscriptionResult = await client.query(
          `SELECT * FROM subscriptions WHERE user_id = $1 AND payment_plan_id = $2 AND status = 'pending'`,
          [userId, payment_plan_id]
        );

        if (subscriptionResult.rows.length) {
          const subscriptionId = subscriptionResult.rows[0].id;
          const orderId = subscriptionResult.rows[0].order_id;

          // Update order and subscription status
          await client.query(
            `UPDATE subscriptions 
             SET status = 'paid', 
                 transaction_ref = $1 
             WHERE id = $2`,
            [tx_ref, subscriptionId]
          );
          await client.query(`UPDATE orders SET status = 'in-progress' WHERE order_id = $1`, [orderId]);

          // Notify customer(method needs to be added)
          // await sendNotification(customer.email, 'Payment Successful', 'Your subscription has been paid.');
        } else {
          // Handle new order creation for recurring subscription
          // Create new order, order_meals and subscription
          const orderCode = generateRandomCode();

          const lastOrderResult = await getLastOrderService(userId);

          const startDate = new Date(lastOrderResult.order.start_date);
          const newStartDate = new Date(startDate.setDate(startDate.getDate() + 7));
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newEndDate.getDate() + 7);

          const newOrderResult = await client.query(
            `INSERT INTO orders (user_id, start_date, end_date, number_of_meals, total_price, code, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
            [userId, newStartDate, newEndDate, lastOrderResult.order.number_of_meals, amount, orderCode, 'in_progress']
          );

          const newOrderId = newOrderResult.rows[0].id;

          // Insert updated meals
          for (const meal of lastOrderResult.meals) {
            const mealCode = generateRandomCode();
            await client.query(sql.createOrderMeals, [
              newOrderId,
              meal.date,
              meal.category,
              meal.bundleId,
              meal.quantity,
              meal.delivery_time,
              meal.location,
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
          // await sendNotification(customer.email, 'Subscription Created', 'Your new subscription has been created.');
        }
      } else {
        return respond(res, { message: 'Unhandled event type' }, HttpStatus.BAD_REQUEST);
      }

      await client.query('COMMIT');
      return respond(res, { message: 'Webhook handled successfully' }, HttpStatus.OK);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Webhook Handling Error:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    } finally {
      client.release();
    }
  }
};
