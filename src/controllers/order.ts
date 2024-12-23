import { RequestHandler } from 'express';
import { QueryResult } from 'pg';
import pool from '../config/database.config';
import HttpStatus from 'http-status-codes';
import { sql } from '../database/sql';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { Item, ParentItem, Bundle } from '../interfaces';
import { respond } from '../utilities';

export const OrderController = {
  createOrder: (): RequestHandler => async (req, res, next) => {
    const { userId, meals } = req.body;

    if (!userId || !meals || !Array.isArray(meals) || meals.length === 0) {
      return respond(res, 'Invalid Request payload', HttpStatus.BAD_REQUEST);
    }

  
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Calculate total price
        const totalPrice = meals.reduce((sum, meal) => sum + meal.price, 0);

        // Insert into orders table
        const insertOrderQuery = `
              INSERT INTO orders (user_id, start_date, end_date, total_price)
              VALUES ($1, $2, $3, $4)
              RETURNING id
            `;
        const startDate = meals[0].date;
        const endDate = meals[meals.length - 1].date;
        const orderResult = await client.query(insertOrderQuery, [userId, startDate, endDate, totalPrice]);
        const orderId = orderResult.rows[0].id;

        // Insert into order_meals table
        const insertMealQuery = `
              INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, location)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id
            `;
        for (const meal of meals) {
          const mealResult = await client.query(insertMealQuery, [
            orderId,
            meal.date,
            meal.category,
            meal.bundleId,
            meal.quantity,
            meal.delivery_time,
            meal.location
          ]);
          const orderMealId = mealResult.rows[0].id;

          // Insert extras into order_extras table (if any)
          if (meal.extras && meal.extras.length > 0) {
            const insertExtrasQuery = `
                  INSERT INTO order_extras (order_id, extra_name, quantity)
                  VALUES ($1, $2, $3)
                `;
            for (const extra of meal.extras) {
              await client.query(insertExtrasQuery, [orderId, extra.name, meal.quantity]);
            }
          }
        }

        await client.query('COMMIT');
        respond(res, { orderId, message: 'Order created successfully'}, HttpStatus.CREATED);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Order Creation Error', error);
        next(error);
      } finally {
        client.release();
      }
    }
};

/**
 * add address per order || primary address
 * add code per order
 * thoughts on fixing recurrent user meals if user creates weekly meals/not
 * 1. label orders as subscription as one-off or recurrent(type)
 * or should orders become subsriptions when payment is made?
 * 2. if recurrent, run jobs to check if it's the end date or whatever agreed upon
 * then prompt them to choose their meals or they get same meal
 */