import { RequestHandler } from 'express';
import { DateTime } from 'luxon';
import pool from '../config/database.config';
import HttpStatus from 'http-status-codes';
import { sql } from '../database/sql';
import type { Order } from '../interfaces';
import { generateRandomCode, respond } from '../utilities';
import { cancelPaymentPlan, createPaymentPlan, generateVirtualAccount, initiatePayment } from '../services/flutterwave';
import { ORDER_STATUS, uomMap } from '../constants';
import { createDeliveryNotes } from '../repository/order';

interface LastOrder {
  order: Order;
  meals: any[];
}

export const getLastOrderService = async (userId: number, status: ORDER_STATUS): Promise<LastOrder | null> => {
  const client = await pool.connect();

  try {
    // Fetch the last created order for the user
    const orderQuery = `
      SELECT * FROM orders
      WHERE user_id = $1
      AND status = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const orderResult = await client.query(orderQuery, [userId, status]);
    console.log({ orderResult });

    if (!orderResult.rows.length) {
      return null; // No orders found
    }

    const order: Order = orderResult.rows[0];
    console.log({ order });

    // Fetch associated meals for the last created order
    const mealsQuery = `
      SELECT * FROM order_meals WHERE order_id = $1
    `;
    const mealsResult = await client.query(mealsQuery, [order.id]);

    const meals = mealsResult.rows;

    return { order, meals };
  } catch (error) {
    console.error('Error fetching last order:', error);
    throw new Error('Failed to fetch last order');
  } finally {
    client.release();
  }
};

export const OrderController = {
  // add dispatch and delivery timestamp to order and its controller
  createOrder: (): RequestHandler => async (req, res, next) => {
    // const { userId, meals } = req.body;
    // /**
    //  * if they have ordered before
    //  * check number of meals and
    //  * do not allow them choose beyond that
    //  */

    // if (!userId || !meals || !Array.isArray(meals) || meals.length === 0) {
    //   return respond(res, 'Invalid Request payload', HttpStatus.BAD_REQUEST);
    // }

    // const client = await pool.connect();

    // try {
    //   await client.query('BEGIN');

    //   // Generate unique six-digit code
    //   const generateCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

    //   // Calculate total price
    //   const totalPrice = meals.reduce((sum, meal) => sum + meal.price, 0);

    //   // Insert into orders table
    //   const insertOrderQuery = `
    //         INSERT INTO orders (user_id, start_date, end_date, total_price, code)
    //         VALUES ($1, $2, $3, $4, $5)
    //         RETURNING id
    //       `;
    //   const startDate = meals[0].date;
    //   const endDate = meals[meals.length - 1].date;
    //   const orderCode = generateCode();
    //   const orderResult = await client.query(insertOrderQuery, [userId, startDate, endDate, totalPrice, orderCode]);
    //   const orderId = orderResult.rows[0].id;
    //   const transaction_ref = `TXREF_${orderCode}_${Date.now().toString()}`

    //   // Insert into order_meals table
    //   const insertMealQuery = `
    //         INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, address, code)
    //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    //         RETURNING id
    //       `;
    //   for (const meal of meals) {
    //     const mealCode = generateCode();
    //     const mealResult = await client.query(insertMealQuery, [
    //       orderId,
    //       meal.date,
    //       meal.category,
    //       meal.bundleId,
    //       meal.quantity,
    //       meal.delivery_time,
    //       meal.address,
    //       mealCode
    //     ]);
    //     const orderMealId = mealResult.rows[0].id;

    //     // Insert extras into order_extras table (if any)
    // if (meal.extras && meal.extras.length > 0) {
    //   const insertExtrasQuery = `
    //         INSERT INTO order_extras (order_id, extra_name, quantity)
    //         VALUES ($1, $2, $3)
    //       `;
    //   for (const extra of meal.extras) {
    //     await client.query(insertExtrasQuery, [orderId, extra.name, meal.quantity]);
    //   }
    // }
    //   }

    //   await client.query('COMMIT');
    //   respond(res, { orderId, message: 'Order created successfully' }, HttpStatus.CREATED);
    // } catch (error) {
    //   await client.query('ROLLBACK');
    //   console.error('Order Creation Error', error);
    //   next(error);
    // } finally {
    //   client.release();
    // }

    const { meals, delivery_type } = req.body;

    const userId = res.locals.user.id;

    if (!userId || !meals || !Array.isArray(meals) || meals.length === 0) {
      return respond(res, 'Invalid Request payload', HttpStatus.BAD_REQUEST);
    }

    if (meals.length > 21) {
      return respond(res, 'Number of meals cannot exceed 21', HttpStatus.BAD_REQUEST);
    }

    const mealOrderAmount = meals.reduce((sum, meal) => sum + meal.price, 0) as number;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const user = await client.query(`SELECT email, phone_number FROM users WHERE id = $1`, [userId]);

      // Check if user has an active payment plan
      const paymentPlanResult = await client.query(`SELECT * FROM payment_plans WHERE user_id = $1 AND status = 'active'`, [userId]);

      let paymentPlanId: string;
      if (paymentPlanResult.rows.length) {
        // Use existing payment plan
        paymentPlanId = paymentPlanResult.rows[0].payment_plan_id;
      } else {
        // Create new payment plan using Flutterwave API
        const flutterwaveResponse = await createPaymentPlan(mealOrderAmount, 'updish_plan', 'hourly'); // This is a separate function to be written.

        if (flutterwaveResponse.status === 'success') {
          paymentPlanId = flutterwaveResponse.data.id;
        } else if (flutterwaveResponse.status === 'error') {
          return respond(res, flutterwaveResponse.message, HttpStatus.EXPECTATION_FAILED);
        }

        // Save new payment plan in DB
        await client.query(`INSERT INTO payment_plans (user_id, payment_plan_id, amount, interval, status) VALUES ($1, $2, $3, $4, $5)`, [
          userId,
          paymentPlanId,
          mealOrderAmount,
          'hourly', // should change this to weekly
          'active'
        ]);
      }

      const orderCode = generateRandomCode();

      // Create the order
      const orderResult = await client.query(sql.createOrder, [
        userId,
        meals[0].date,
        meals[meals.length - 1].date,
        paymentPlanId,
        meals.length,
        mealOrderAmount,
        orderCode,
        ORDER_STATUS.CREATED,
        delivery_type
      ]);

      //@ts-ignore
      const orderId = orderResult.rows[0].id;

      // Insert meals into `order_meals` table
      const mealQuery = `
      INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, address, code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id`;

      console.log({ meals });
      for (const meal of meals) {
        const mealCode = generateRandomCode();
        const mealResult = await client.query(mealQuery, [
          orderId,
          meal.date,
          meal.category,
          meal.bundleId,
          meal.quantity,
          meal.delivery_time,
          meal.address,
          mealCode
        ]);
        const orderMealId = mealResult.rows[0].id;

        // Insert extras into order_extras table (if any)
        if (meal.extras && meal.extras.length > 0) {
          const insertExtrasQuery = `
                INSERT INTO order_extras (order_meal_id, extra_name, quantity)
                VALUES ($1, $2, $3)
              `;
          for (const extra of meal.extras) {
            await client.query(insertExtrasQuery, [orderMealId, extra.name, meal.quantity]);
          }
        }
      }

      // initiate payment for card customer and include payment_plan_id in the payload.
      const initiatePaymentResponse = await initiatePayment({
        amount: String(mealOrderAmount),
        payment_plan: paymentPlanId,
        email: user.rows[0].email,
        phonenumber: user.rows[0].phone_number,
        order_code: orderCode
      });

      // Subscribe the user to the payment plan
      await client.query(
        `INSERT INTO subscriptions (user_id, payment_plan_id, transaction_ref, order_id, start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          paymentPlanId,
          initiatePaymentResponse.transaction_ref,
          orderId,
          meals[0].date,
          meals[meals.length - 1].date,
          mealOrderAmount,
          'pending'
        ]
      );

      await client.query('COMMIT');
      respond(res, { orderId, message: 'Order created successfully', payment_link: initiatePaymentResponse.data }, HttpStatus.CREATED);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      next(error);
    } finally {
      client.release();
    }
  },

  createTransferTypeOrder: (): RequestHandler => async (req, res, next) => {
    const { userId, meals, delivery_type } = req.body;

    if (!userId || !meals || !Array.isArray(meals) || meals.length === 0) {
      return respond(res, 'Invalid Request payload', HttpStatus.BAD_REQUEST);
    }
    if (meals.length > 21) {
      return respond(res, 'Number of meals cannot exceed 21', HttpStatus.BAD_REQUEST);
    }
    const mealOrderAmount = meals.reduce((sum, meal) => sum + meal.price, 0) as number;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderCode = generateRandomCode();
      // Create the order
      const orderResult = await client.query(sql.createOrder, [
        userId,
        meals[0].date,
        meals[meals.length - 1].date,
        'N/A',
        meals.length,
        mealOrderAmount,
        orderCode,
        ORDER_STATUS.CREATED,
        delivery_type
      ]);

      //@ts-ignore
      const orderId = orderResult.rows[0].id;

      // Insert meals into `order_meals` table
      const mealQuery = `
      INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, address, code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id`;

      console.log({ meals });
      for (const meal of meals) {
        const mealCode = generateRandomCode();
        const mealResult = await client.query(mealQuery, [
          orderId,
          meal.date,
          meal.category,
          meal.bundleId,
          meal.quantity,
          meal.delivery_time,
          meal.address,
          mealCode
        ]);
        const orderMealId = mealResult.rows[0].id;

        // Insert extras into order_extras table (if any)
        if (meal.extras && meal.extras.length > 0) {
          const insertExtrasQuery = `
                INSERT INTO order_extras (order_meal_id, extra_name, quantity)
                VALUES ($1, $2, $3)
              `;
          for (const extra of meal.extras) {
            await client.query(insertExtrasQuery, [orderMealId, extra.name, meal.quantity]);
          }
        }
      }

      const user = await client.query(`SELECT email, phone_number FROM users WHERE id = $1`, [userId]);

      const virtualAccountResponse = await generateVirtualAccount({ email: user.rows[0].email, amount: mealOrderAmount, order_code: orderCode });

      // Subscribe the user for the week
      await client.query(
        `INSERT INTO subscriptions (user_id, payment_plan_id, transaction_ref, order_id, start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, 'N/A', virtualAccountResponse.transaction_ref, orderId, meals[0].date, meals[meals.length - 1].date, mealOrderAmount, 'pending']
      );

      await client.query('COMMIT');
      respond(res, { orderId, message: 'Order created successfully', data: { ...virtualAccountResponse.data, mealOrderAmount } }, HttpStatus.CREATED);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
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

      const getFilteredBundleItemQuantities = async ({ singleDate, startDate, endDate, deliveryTime }: FilterParams) => {
        const query = `
        SELECT 
            i.name AS item_name,
            i.uom AS uom,
            SUM(bi.qty * om.quantity) AS total_quantity
        FROM 
            orders o
        JOIN 
            subscriptions s ON s.order_id = o.id
        JOIN 
            order_meals om ON o.id = om.order_id
        JOIN 
            bundles b ON om.bundle_id = b.id
        JOIN 
            bundle_items bi ON b.id = bi.bundle_id
        JOIN 
            items i ON bi.item = i.id
        WHERE 
            s.status = 'paid'
            AND (
                ($1::DATE IS NULL OR om.date = $1::DATE)
                OR ($2::DATE IS NOT NULL AND $3::DATE IS NOT NULL AND om.date BETWEEN $2::DATE AND $3::DATE)
            )
            AND ($4::VARCHAR IS NULL OR om.delivery_time = $4::VARCHAR)
        GROUP BY 
            i.name, i.uom
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
        deliveryTime: deliveryTime as string | undefined
      });

      const updatedData = data.map((each) => ({
        ...each,
        uom: uomMap[each.uom] || each.uom
      }));

      return respond(res, { message: 'Demand summary retrieved successfully', data: updatedData }, HttpStatus.OK);
    } catch (error) {
      console.log({ error });
      next(error);
    }
  },

  /**
   *
   * fetch all weekly orders
   */
  getOrders: (): RequestHandler => async (req, res, next) => {
    try {
      const { date, startDate, endDate, page, limit, status } = req.query;

      const pageNumber = parseInt(page as string, 10) || 1;
      const pageSize = parseInt(limit as string, 10) || 10;

      const getOrdersWithPaginations = async (status: string, startDate?: string, endDate?: string, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;

        const queryParams: (string | number)[] = [];
        let baseQuery = `FROM orders o WHERE 1=1`;

        // Add status filter if provided
        if (status) {
          baseQuery += ` AND status = $${queryParams.length + 1}`;
          queryParams.push(status as string);
        }

        // Handle date filters
        const start_date = startDate || new Date().toISOString().split('T')[0]; // Default to today
        const end_date = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 7 days ahead

        baseQuery += ` AND (start_date >= $${queryParams.length + 1} AND end_date <= $${queryParams.length + 2})`;
        queryParams.push(start_date, end_date);

        console.log({ queryParams });

        // Construct countQuery
        const countQuery = `SELECT COUNT(*) ${baseQuery}`;

        const dataQuery = `
        SELECT
        o.id AS order_id,
        o.start_date,
        o.end_date,
        o.status,
        o.total_price,
        o.code AS order_code,
        o.created_at AS order_created_at,
        o.updated_at AS order_updated_at 
        ${baseQuery}
        ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        queryParams.push(pageSize, offset);

        // Execute queries
        const countResult = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2)); // Remove LIMIT and OFFSET for countQuery
        const { rows } = await pool.query(dataQuery, queryParams);

        const totalRecords = parseInt(countResult.rows[0].count, 10);

        return {
          data: rows,
          totalRecords,
          page,
          totalPages: Math.ceil(totalRecords / limit)
        };
      };

      // const getOrdersWithPagination = async (date?: string, startDate?: string, endDate?: string, page = 1, limit = 10) => {
      //   const offset = (page - 1) * limit;

      //   const query = `
      //       SELECT
      //           o.id AS order_id,
      //           o.start_date,
      //           o.end_date,
      //           o.status,
      //           o.total_price,
      //           o.code AS order_code,
      //           o.created_at AS order_created_at,
      //           o.updated_at AS order_updated_at,
      //           om.id AS order_meal_id,
      //           om.date AS meal_date,
      //           om.category AS meal_category,
      //           om.quantity AS meal_quantity,
      //           om.delivery_time,
      //           om.address,
      //           om.code AS meal_code,
      //           b.id AS bundle_id,
      //           b.name AS bundle_name,
      //           b.health_impact AS bundle_health_impact,
      //           bi.item AS item_id,
      //           i.name AS item_name,
      //           bi.qty AS item_quantity_per_bundle,
      //           u.id AS user_id,
      //           u.first_name AS customer_first_name,
      //           u.last_name AS customer_last_name,
      //           u.email AS customer_email,
      //           u.phone_number AS customer_phone_number
      //       FROM
      //           orders o
      //       JOIN
      //           users u ON o.user_id = u.id
      //       JOIN
      //           order_meals om ON o.id = om.order_id
      //       JOIN
      //           bundles b ON om.bundle_id = b.id
      //       JOIN
      //           bundle_items bi ON b.id = bi.bundle_id
      //       JOIN
      //           items i ON bi.item = i.id
      //       WHERE
      //           ($1::DATE IS NULL OR om.date = $1::DATE)
      //           AND ($2::DATE IS NULL OR om.date BETWEEN $2::DATE AND $3::DATE)
      //       ORDER BY
      //           o.created_at DESC
      //       LIMIT $4 OFFSET $5;
      //     `;

      //   const query1 = `SELECT
      //     o.id AS order_id,
      //     o.start_date,
      //     o.end_date,
      //     o.status,
      //     o.total_price,
      //     o.code AS order_code,
      //     o.created_at AS order_created_at,
      //     o.updated_at AS order_updated_at,

      //     WHERE
      //           ($1::DATE IS NULL)
      //       ORDER BY
      //           o.created_at DESC
      //       LIMIT $2 OFFSET $3;
      //     `;

      //   const params1 = [date || null, limit, offset];
      //   const params = [date || null, startDate || null, endDate || null, limit, offset];
      //   const result = await pool.query(query, params);

      //   // Count total rows for pagination metadata
      //   const countQuery = `
      //       SELECT COUNT(*) AS total
      //       FROM orders o
      //       JOIN order_meals om ON o.id = om.order_id
      //       WHERE
      //           ($1::DATE IS NULL OR om.date = $1::DATE)
      //           AND ($2::DATE IS NULL OR om.date BETWEEN $2::DATE AND $3::DATE);
      //     `;
      //   const countResult = await pool.query(countQuery, [date || null, startDate || null, endDate || null]);
      //   const total = parseInt(countResult.rows[0].total, 10);

      //   return {
      //     data: result.rows,
      //     total,
      //     page,
      //     totalPages: Math.ceil(total / limit)
      //   };
      // };

      const { data, totalRecords, totalPages } = await getOrdersWithPaginations(
        status as string | undefined,
        startDate as string | undefined,
        endDate as string | undefined,
        pageNumber,
        pageSize
      );
      return respond(res, { message: 'Orders retrieved successfully', data, totalRecords, page: pageNumber, totalPages }, HttpStatus.OK);
    } catch (error) {
      console.error('Error fetching paginated orders:', error);
      next(error);
    }
  },

  /**
   *
   * fetch details for an order (weekly order)
   */
  getOrderDetails: (): RequestHandler => async (req, res, next) => {
    try {
      const order_id = req.params.id;
      const query = `
      -- Step 1: Aggregate Items per Bundle
      WITH bundle_items_cte AS (
          SELECT 
              b.id AS bundle_id,
              JSONB_AGG(
                  DISTINCT JSONB_BUILD_OBJECT(
                      'id', i.id,
                      'name', i.name,
                      'uom', i.uom,
                      'description', i.description,
                      'allergies', i.allergies,
                      'class_of_food', i.class_of_food,
                      'calories_per_uom', i.calories_per_uom,
                      'qty', bi.qty
                  )
              ) AS items
          FROM bundles b
          LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
          LEFT JOIN items i ON bi.item = i.id
          GROUP BY b.id
      ),
      
      -- Step 2: Attach Bundles to Order Meals
      order_meals_cte AS (
          SELECT 
              om.id AS order_meal_id,
              om.order_id,
              om.date,
              om.category,
              om.bundle_id,
              om.quantity,
              om.delivery_time,
              om.address,
              om.code,
              JSONB_BUILD_OBJECT(
                  'id', b.id,
                  'name', b.name,
                  'category', b.category,
                  'price', b.price,
                  'items', COALESCE(bi_cte.items, '[]')
              ) AS bundle,
              COALESCE(
                  JSONB_AGG(
                      DISTINCT JSONB_BUILD_OBJECT(
                          'id', oe.id,
                          'extra_name', oe.extra_name,
                          'quantity', oe.quantity
                      )
                  ) FILTER (WHERE oe.id IS NOT NULL),
                  '[]'
              ) AS extras
          FROM order_meals om
          LEFT JOIN bundles b ON om.bundle_id = b.id
          LEFT JOIN bundle_items_cte bi_cte ON b.id = bi_cte.bundle_id
          LEFT JOIN order_extras oe ON om.id = oe.order_meal_id
          GROUP BY om.id, b.id, bi_cte.items
      ),
      
      -- Step 3: Aggregate Order Meals for Each Order
      orders_cte AS (
          SELECT 
              o.*,
              JSONB_AGG(
                  JSONB_BUILD_OBJECT(
                      'id', om_cte.order_meal_id,
                      'date', om_cte.date,
                      'category', om_cte.category,
                      'bundle_id', om_cte.bundle_id,
                      'quantity', om_cte.quantity,
                      'delivery_time', om_cte.delivery_time,
                      'address', om_cte.address,
                      'code', om_cte.code,
                      'bundle', om_cte.bundle,
                      'extras', om_cte.extras
                  )
              ) AS order_meals
          FROM orders o
          LEFT JOIN order_meals_cte om_cte ON o.id = om_cte.order_id
          GROUP BY o.id
      )
      
      -- Step 4: Join Orders with Users
      SELECT 
          o_cte.*,
          JSONB_BUILD_OBJECT(
              'id', u.id,
              'name', u.first_name,
              'email', u.email
          ) AS user
      FROM orders_cte o_cte
      INNER JOIN users u ON o_cte.user_id = u.id
      WHERE o_cte.id = $1;
      
      `;
      const { rows } = await pool.query(query, [order_id]);

      if (rows.length === 0) {
        return respond(res, { message: 'Order details not found' }, HttpStatus.NOT_FOUND);
      }

      return respond(res, { message: 'Order details retrieved successfully', data: rows[0] }, HttpStatus.OK);
    } catch (error) {
      console.error('Error fetching order details:', error);
      next(error);
    }
  },

  /**
   *
   * fetch a single order inlcuding oder meals and possible attachments
   */
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
              om.address,
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
      console.error('Error fetching order details:', error);
      next(error);
    }
  },

  /**
   *
   * @returns last created order with order meals
   */
  getLastOrder: (): RequestHandler => async (req, res) => {
    const userId = res.locals.user.id;

    try {
      const lastOrder = await getLastOrderService(Number(userId), ORDER_STATUS.COMPLETED);

      if (!lastOrder) {
        return res.status(404).json({ message: 'No orders found for this user' });
      }

      // Perform additional logic with the lastOrder data
      console.log('Last order details:', lastOrder);

      return res.status(200).json({
        message: 'Successfully fetched last order in other context',
        lastOrder
      });
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      return respond(res, 'Failed to fetch last order', HttpStatus.BAD_GATEWAY);
    }
  },

  updateOrderMeals: (): RequestHandler => async (req, res, next) => {
    const userId = res.locals.user.id;
    const { code, meals } = req.body;

    console.log({ meals });

    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return respond(res, 'Invalid meals payload', HttpStatus.BAD_REQUEST);
    }

    const mealOrderAmount = meals.reduce((sum, meal) => sum + meal.price, 0) as number;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Fetch active user plan
      const activePaymentPlanResult = await client.query(`SELECT * from payment_plans WHERE user_id = $1 AND status = 'active'`, [userId]);

      if (!activePaymentPlanResult.rows.length) {
        return respond(res, { message: 'No active user plan found' }, HttpStatus.BAD_REQUEST);
      }
      const payment_plan_id = activePaymentPlanResult.rows[0].payment_plan_id;

      // Fetch the existing order in-progress that has order_meals
      const currentOrderResult = await getLastOrderService(userId, ORDER_STATUS.DELIVERING);
      console.log({ currentOrderResult });
      if (!currentOrderResult || !currentOrderResult?.meals?.length) {
        return respond(res, { message: 'No current order_meal found' }, HttpStatus.NOT_FOUND);
      }

      //we can use the number_of_meals here or the value from meals array
      const previousOrderMeals = currentOrderResult?.meals;

      // Check meal count
      if (meals.length !== previousOrderMeals.length) {
        return respond(res, `Number of meals must match the original order (${previousOrderMeals.length})`, HttpStatus.BAD_REQUEST);
      }

      // check that the new order price still matches the payment_plan_amount
      console.log({ mealOrderAmount });
      if (mealOrderAmount != activePaymentPlanResult.rows[0].amount) {
        return respond(res, `Order cost should not exceed payment plan`, HttpStatus.BAD_REQUEST);
      }

      // check that the customer has paid and webhook has received notification
      const upcomingOrder = await client.query(`SELECT * FROM orders WHERE user_id = $1 AND payment_plan_id = $2 AND status = 'paid'`, [
        userId,
        payment_plan_id
      ]);
      console.log({ upcomingOrder });
      if (!upcomingOrder.rows.length) {
        return respond(res, `You have not been charged for the upcoming order, please check back.`, HttpStatus.BAD_REQUEST);
      }

      const orderId = upcomingOrder.rows[0].id;

      // check that time difference between time of update and start_date of upcoming meal is >=24 hrs
      const upcomingOrderStartDateString = new Date(upcomingOrder.rows[0].start_date).toISOString();
      const upcomingOrderStartDate = DateTime.fromISO(upcomingOrderStartDateString).setZone('Africa/Lagos').startOf('day');
      const currentTime = DateTime.now().setZone('Africa/Lagos');
      const hourlyDiff = upcomingOrderStartDate.diff(currentTime, 'hours').hours;
      if (hourlyDiff < 24) {
        return respond(res, `Meals update cannot be made less than 24 hours to start of order`, HttpStatus.BAD_REQUEST);
      }
      // introduce a boolean column on order to tell if upcoming order has already been updated by customer

      // // ensure there is no pending subscription to avoid multiple update
      // const existingPendingSubscription = await client.query(
      //   `
      //   SELECT * FROM subscriptions
      //   WHERE user_id = $1
      //   AND payment_plan_id = $2
      //   AND status = 'pending'
      //   `,
      //   [userId, payment_plan_id]
      // );

      // if (existingPendingSubscription.rows.length) {
      //   return respond(res, { message: 'You have a pending updated order' }, HttpStatus.CONFLICT);
      // }

      // // create a new order for the week – it is a new order regardless whether it's the same meals as the last order
      // const orderCode = generateRandomCode();
      // const orderResult = await client.query(sql.createOrder, [
      //   userId,
      //   meals[0].date,
      //   meals[meals.length - 1].date,
      //   currentOrderResult.order.payment_plan_id,
      //   meals.length,
      //   mealOrderAmount,
      //   orderCode,
      //   'created'
      // ]);
      // //@ts-ignore
      // const orderId = orderResult.rows[0].id;

      // // create subscription for the new week
      // //@ts-ignore
      // const startDate = new Date(orderResult.rows[0].start_date);
      // const newStartDate = new Date(startDate.setDate(startDate.getDate() + 7));
      // const newEndDate = new Date(newStartDate);
      // newEndDate.setDate(newEndDate.getDate() + 7);

      // await client.query(
      //   `INSERT INTO subscriptions (user_id, order_id, start_date, end_date, payment_plan_id, total_price, status)
      //        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      //   [userId, orderId, newStartDate, newEndDate, payment_plan_id, mealOrderAmount, 'pending']
      // );

      // // Insert updated meals
      // for (const meal of meals) {
      //   const mealCode = generateRandomCode();
      //   await client.query(sql.createOrderMeals, [
      //     upcomingOrder.rows[0].id,
      //     meal.date,
      //     meal.category,
      //     meal.bundleId,
      //     meal.quantity,
      //     meal.delivery_time,
      //     meal.address,
      //     mealCode
      //   ]);
      // }

      // Delete existing records
      await client.query('DELETE FROM order_meals WHERE order_id = $1', [orderId]);

      // Insert new records (Batch Insert)
      const values = meals
        .map(
          (_, index) =>
            `($1, $${index * 7 + 2}::DATE, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7}::TEXT, $${index * 7 + 8})`
        )
        .join(', ');

      const params = [
        orderId,
        ...meals.flatMap(({ category, bundleId, quantity, date, delivery_time, address }) => [
          date,
          category,
          bundleId,
          quantity,
          delivery_time,
          address,
          generateRandomCode()
        ])
      ];

      const query = `
      INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, address, code)
      VALUES ${values}
      `;

      await client.query(query, params);

      await client.query('COMMIT');
      respond(res, { message: 'Order meals updated successfully' }, HttpStatus.OK);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating order meals:', error);
      next(error);
    } finally {
      client.release();
    }
  },

  cancelPaymentPlan: (): RequestHandler => async (req, res) => {
    try {
      const userId = res.locals.user.id;

      const existingPaymentPlan = await pool.query(
        `
        SELECT * FROM payment_plans WHERE user_id = $1 AND status = 'active'
      `,
        [userId]
      );
      if (!existingPaymentPlan.rows.length) {
        return respond(res, { message: 'No active plan for this user' }, HttpStatus.NOT_FOUND);
      }
      const cancelPlanResponse = await cancelPaymentPlan(existingPaymentPlan.rows[0].payment_plan_id);

      if (cancelPlanResponse.status === 'success') {
        await pool.query(
          `UPDATE payment_plans
          SET status = 'cancelled'
          WHERE id = $1
        `,
          [existingPaymentPlan.rows[0].id]
        );
        return respond(res, { message: 'Payment plan cancelled', data: cancelPlanResponse }, HttpStatus.OK);
      }

      return respond(res, { message: 'Failed to cancel plan', data: cancelPlanResponse }, HttpStatus.BAD_REQUEST);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      return respond(res, { message: 'Could not create delivery notes' }, HttpStatus.BAD_GATEWAY);
    }
  }
};

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
        "address": "123 Main St, Springfield",
        "extras": [{"id": 2, "name": "Plantain", "price": 150}],
        "price": 700
      },
      {
        "date": "2024-12-22",
        "category": "Lunch",
        "bundleId": 4,
        "delivery_time": "1:00 PM - 2:30 PM",
        "quantity": 2,
        "address": "123 Main St, Springfield",
        "extras": [],
        "price": 1400
      },
      {
        "date": "2024-12-23",
        "category": "Dinner",
        "bundleId": 5,
        "delivery_time": "6:00 PM - 7:30 PM",
        "quantity": 2,
        "address": "123 Main St, Springfield",
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

/**
 * check for length of meals in the array, if more than 21 error out
 * if less or equal to 21, proceed
 * before creating an order check if there's an active payment plan for user
 * if there's use that payment plan
 * else create one
 * subscribe the user to the payment plan
 * create order, order_meals and co
 *
 *
 * create endpoint to receive webhooks from fluuterwave
 * once the webhook is received,
 * if status is successful,
 * if existing customer order is found with transaction_ref in webhook,
 * update the order status to paid
 * update subscription status
 * and notify customer via in-app and email of successful subscription
 * else if no transaction_ref in webhook payload or available transaction_ref from flutterwave is not tied to any order in orders table based on customer email from flutterwave,
 * then create an order with transaction_ref(if available),payment_plan_id, total_price, code, status of paid and start_date should be 7days from start_date of last order
 * and end_date should be 7days from new start_date
 * also create a subscription
 * send in-app and email notification to customers so they can enter the app and select new set of meals for the weekly subscription
 *
 *
 * create a new patch endpoint that takes in meals and orderId or code(generated from recurring subscription)
 * before updating the order check if meals sent in are same number of meals as in last order
 * if not same throw an error that number of meals must be same
 * else update the order with number of meals and create the order meals
 *
 *
 * create endpoint that fetches last customer order and order_meals plus extras if any
 * 
 *  CREATE ORDER RES
  * {
      "status": "success",
      "data": {
          "orderId": 16,
          "message": "Order created successfully",
          "payment_link": {
              "link": "https://checkout-v2.dev-flutterwave.com/v3/hosted/pay/8d0c3f328b58f5d6f394"
          }
      },
      "meta": {}
  }
 *  
  REDIRECT_URL after payment completion
  https://example_company.com/success?status=successful&tx_ref=TXREF_331273_1738227346167&transaction_id=8355329
 */
