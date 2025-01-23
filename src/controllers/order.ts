import { RequestHandler } from 'express';
import { QueryResult } from 'pg';
import pool from '../config/database.config';
import HttpStatus from 'http-status-codes';
import { sql } from '../database/sql';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { Item, ParentItem, Bundle } from '../interfaces';
import { respond } from '../utilities';

export const OrderController = {
  // add dispatch and delivery timestamp to order and its controller
  createOrder: (): RequestHandler => async (req, res, next) => {
    const { userId, meals } = req.body;

    if (!userId || !meals || !Array.isArray(meals) || meals.length === 0) {
      return respond(res, 'Invalid Request payload', HttpStatus.BAD_REQUEST);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate unique six-digit code
      const generateCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

      // Calculate total price
      const totalPrice = meals.reduce((sum, meal) => sum + meal.price, 0);

      // Insert into orders table
      const insertOrderQuery = `
            INSERT INTO orders (user_id, start_date, end_date, total_price, code)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `;
      const startDate = meals[0].date;
      const endDate = meals[meals.length - 1].date;
      const orderCode = generateCode();
      const orderResult = await client.query(insertOrderQuery, [userId, startDate, endDate, totalPrice, orderCode]);
      const orderId = orderResult.rows[0].id;
      const transaction_ref = `TXREF_${orderCode}_${Date.now().toString()}`

      // Insert into order_meals table
      const insertMealQuery = `
            INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, location, code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `;
      for (const meal of meals) {
        const mealCode = generateCode();
        const mealResult = await client.query(insertMealQuery, [
          orderId,
          meal.date,
          meal.category,
          meal.bundleId,
          meal.quantity,
          meal.delivery_time,
          meal.location,
          mealCode
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
      respond(res, { orderId, message: 'Order created successfully' }, HttpStatus.CREATED);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Order Creation Error', error);
      next(error);
    } finally {
      client.release();
    }
  },

  demandSummary: (): RequestHandler => async (req, res, next) => {
    try {
      const { singleDate, startDate, endDate, deliveryTime } = req.query;

    if (!singleDate && (!startDate || !endDate)) {
      return respond(res, 'Either singleDate or startDate and endDate are required', HttpStatus.BAD_REQUEST);
    }

    interface FilterParams {
      singleDate?: string;
      startDate?: string;
      endDate?: string;
      deliveryTime?: string;
    }
    
    const getFilteredBundleItemQuantities = async ({
      singleDate,
      startDate,
      endDate,
      deliveryTime,
    }: FilterParams) => {
      const query = `
        SELECT 
            i.name AS item_name,
            SUM(bi.qty * om.quantity) AS total_quantity
        FROM 
            orders o
        JOIN 
            order_meals om ON o.id = om.order_id
        JOIN 
            bundles b ON om.bundle_id = b.id
        JOIN 
            bundle_items bi ON b.id = bi.bundle_id
        JOIN 
            items i ON bi.item = i.id
        WHERE 
            o.status = 'paid'
            AND (
                ($1::DATE IS NULL OR om.date = $1::DATE)
                OR ($2::DATE IS NOT NULL AND $3::DATE IS NOT NULL AND om.date BETWEEN $2::DATE AND $3::DATE)
            )
            AND ($4 IS NULL OR om.delivery_time = $4)
        GROUP BY 
            i.name
        ORDER BY 
            total_quantity DESC;
      `;
    
      const params = [singleDate || null, startDate || null, endDate || null, deliveryTime || null];
      const result = await pool.query(query, params);
      return result.rows;
    };

    const data = await getFilteredBundleItemQuantities({
      singleDate: singleDate as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      deliveryTime: deliveryTime as string | undefined,
    });

    return respond(res, {message: 'Demand summary retrieved successfully', data }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  getOrders: (): RequestHandler => async (req, res, next) => {

      try {
        const { date, startDate, endDate, page, limit } = req.query;
    
        const pageNumber = parseInt(page as string, 10) || 1;
        const pageSize = parseInt(limit as string, 10) || 10;

        const getOrdersWithPagination = async (
          date?: string,
          startDate?: string,
          endDate?: string,
          page = 1,
          limit = 10
        ) => {
          const offset = (page - 1) * limit;
        
          const query = `
            SELECT 
                o.id AS order_id,
                o.start_date,
                o.end_date,
                o.status,
                o.total_price,
                o.code AS order_code,
                o.created_at AS order_created_at,
                o.updated_at AS order_updated_at,
                om.id AS order_meal_id,
                om.date AS meal_date,
                om.category AS meal_category,
                om.quantity AS meal_quantity,
                om.delivery_time,
                om.location,
                om.code AS meal_code,
                b.id AS bundle_id,
                b.name AS bundle_name,
                b.health_impact AS bundle_health_impact,
                bi.item AS item_id,
                i.name AS item_name,
                bi.qty AS item_quantity_per_bundle,
                u.id AS user_id,
                u.first_name AS customer_first_name,
                u.last_name AS customer_last_name,
                u.email AS customer_email,
                u.phone_number AS customer_phone_number
            FROM 
                orders o
            JOIN 
                users u ON o.user_id = u.id
            JOIN 
                order_meals om ON o.id = om.order_id
            JOIN 
                bundles b ON om.bundle_id = b.id
            JOIN 
                bundle_items bi ON b.id = bi.bundle_id
            JOIN 
                items i ON bi.item = i.id
            WHERE 
                ($1::DATE IS NULL OR om.date = $1::DATE)
                AND ($2::DATE IS NULL OR om.date BETWEEN $2::DATE AND $3::DATE)
            ORDER BY 
                o.created_at DESC
            LIMIT $4 OFFSET $5;
          `;
        
          const params = [date || null, startDate || null, endDate || null, limit, offset];
          const result = await pool.query(query, params);
        
          // Count total rows for pagination metadata
          const countQuery = `
            SELECT COUNT(*) AS total
            FROM orders o
            JOIN order_meals om ON o.id = om.order_id
            WHERE 
                ($1::DATE IS NULL OR om.date = $1::DATE)
                AND ($2::DATE IS NULL OR om.date BETWEEN $2::DATE AND $3::DATE);
          `;
          const countResult = await pool.query(countQuery, [date || null, startDate || null, endDate || null]);
          const total = parseInt(countResult.rows[0].total, 10);
        
          return {
            data: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
          };
        };
    
        const { data, total, totalPages } = await getOrdersWithPagination(
          date as string | undefined,
          startDate as string | undefined,
          endDate as string | undefined,
          pageNumber,
          pageSize
        );
        return respond(res, { message: 'Orders retrieved successfully', data, total, page: pageNumber, totalPages }, HttpStatus.OK);
      } catch (error) {
        console.error("Error fetching paginated orders:", error);
        next(error);
      }
  },

  getSalesOrder: (): RequestHandler => async (req, res, next) => {
    try {
      const { code } = req.params;
  
      if (!code) {
        return respond(res, 'Order code is required', HttpStatus.BAD_REQUEST);
      }

      const getOrderDetailsByCode = async (orderCode: string) => {
        const query = `
          SELECT 
              o.id AS order_id,
              o.code AS order_code,
              om.id AS order_meal_id,
              om.date AS meal_date,
              om.category AS meal_category,
              om.quantity AS meal_quantity,
              om.delivery_time,
              om.location,
              om.code AS meal_code,
              b.id AS bundle_id,
              b.name AS bundle_name,
              bi.item AS item_id,
              i.name AS item_name,
              bi.qty AS item_quantity_per_bundle
          FROM 
              orders o
          JOIN 
              order_meals om ON o.id = om.order_id
          JOIN 
              bundles b ON om.bundle_id = b.id
          JOIN 
              bundle_items bi ON b.id = bi.bundle_id
          JOIN 
              items i ON bi.item = i.id
          WHERE 
              o.code = $1;
        `;
        const params = [orderCode];
        const result = await pool.query(query, params);
        return result.rows;
      };
  
      const orderDetails = await getOrderDetailsByCode(code);
  
      if (orderDetails.length === 0) {
        return respond(res, 'Order not found', HttpStatus.NOT_FOUND);
      }

      return respond(res, { message: 'Order details retrieved successfully', data: orderDetails }, HttpStatus.OK);
    } catch (error) {
      console.error("Error fetching order details:", error);
      next(error);
    }
  }
}

/**
 * add dispatch and delivery timestamp to order and its controller
 */

/** 
 * ORDER CREATION REQUEST
 * {
    "userId": 1,
    // "startDate": "2024-12-21",
    // "endDate": "2024-12-27",
    "meals": [
      {
        "date": "2024-12-21",
        "category": "Breakfast",
        "bundleId": 3,
        "delivery_time": "7:00 AM - 9:00 AM",
        "quantity": 1,
        "location": "123 Main St, Springfield",
        "extras": [{"id": 2, "name": "Plantain", "price": 150}],
        "price": 700
      },
      {
        "date": "2024-12-22",
        "category": "Lunch",
        "bundleId": 4,
        "delivery_time": "1:00 PM - 2:30 PM",
        "quantity": 2,
        "location": "123 Main St, Springfield",
        "extras": [],
        "price": 1400
      },
      {
        "date": "2024-12-23",
        "category": "Dinner",
        "bundleId": 5,
        "delivery_time": "6:00 PM - 7:30 PM",
        "quantity": 2,
        "location": "123 Main St, Springfield",
        "price": 1200
      }
    ]
  }
 */
/**
 * fetch user last ordered meals
 * (the above will be useful for users that were debited 
 * but did not place an order or for others as well)
 * 
 * notify users 48hrs and 24hrs to the end of subsription
 * 
 * user can pause subscription(won't be charged for the next week)
 * once there's a pause request, we remove them from the plan
 * 
 * user can continue paused subscription
 */

