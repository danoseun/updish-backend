import { RequestHandler } from "express";
import HttpStatus from "http-status-codes";
import pool from '../config/database.config';
import crypto from 'crypto';


export const WebHookController = {
    handleWebhook: (): RequestHandler => async (req, res) => {
        console.log('WEBHOOK', req.body);
        const { event, data } = req.body;
        const signature = req.headers['verif-hash']; // Header sent by Flutterwave
        const secretHash = process.env.FLUTTERWAVE_SECRET_HASH; // Set in environment variables
      
        // Verify the signature
        if (!secretHash || !signature || signature !== crypto.createHash('sha256').update(secretHash).digest('hex')) {
          return res.status(401).json({ message: 'Invalid or missing signature' });
        }
      
        if (event === 'subscription.payment_completed') {
          const { tx_ref, amount, customer } = data;
      
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
      
            // Check for existing order with the transaction reference
            const orderResult = await client.query(
              `SELECT * FROM orders WHERE transaction_ref = $1`,
              [tx_ref]
            );
      
            if (orderResult.rows.length) {
              const orderId = orderResult.rows[0].id;
      
              // Update order and subscription status
              await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [orderId]);
              await client.query(
                `UPDATE subscriptions SET status = 'paid' WHERE order_id = $1`,
                [orderId]
              );
      
              // Notify customer(method needs to be added)
              await sendNotification(customer.email, 'Payment Successful', 'Your subscription has been paid.');
            } else {
              // Handle new order creation for recurring subscription
              const userResult = await client.query(
                `SELECT id FROM users WHERE email = $1`,
                [customer.email]
              );
      
              if (!userResult.rows.length) throw new Error('User not found');
      
              const userId = userResult.rows[0].id;
      
              // Create new order and subscription
              const orderCode = Math.floor(100000 + Math.random() * 900000).toString();
              const lastOrderResult = await client.query(
                `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [userId]
              );
      
              const startDate = new Date(lastOrderResult.rows[0].start_date);
              const newStartDate = new Date(startDate.setDate(startDate.getDate() + 7));
              const newEndDate = new Date(newStartDate);
              newEndDate.setDate(newEndDate.getDate() + 7);
      
              const newOrderResult = await client.query(
                `INSERT INTO orders (user_id, start_date, end_date, payment_plan_id, number_of_meals, total_price, code, status, transaction_ref)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
                [
                  userId,
                  newStartDate,
                  newEndDate,
                  data.payment_plan,
                  lastOrderResult.rows[0].number_of_meals,
                  amount,
                  orderCode,
                  'paid',
                  tx_ref,
                ]
              );
      
              const newOrderId = newOrderResult.rows[0].id;
      
              // Create a subscription
              await client.query(
                `INSERT INTO subscriptions (user_id, order_id, start_date, end_date, payment_plan_id, total_price, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, newOrderId, newStartDate, newEndDate, data.payment_plan, amount, 'paid']
              );
      
              // Notify customer(needs to be added)
              await sendNotification(customer.email, 'Subscription Created', 'Your new subscription has been created.');
            }
      
            await client.query('COMMIT');
            res.status(200).json({ message: 'Webhook handled successfully' });
          } catch (error) {
            await client.query('ROLLBACK');
            console.error('Webhook Handling Error:', error);
            res.status(500).json({ error: 'Failed to process webhook' });
          } finally {
            client.release();
          }
        } else {
          res.status(400).json({ message: 'Unhandled event type' });
        }
      }  
}