import { generateDeliveryNoteCode } from '../utilities';
import db from '../database/query';
import { sql } from '../database/sql';
import { Order, User } from '../interfaces';
import { findUserById } from './user';
import pool from '../config/database.config';
import format from 'pg-format';
import { BadRequestError } from '@src/errors';
import { PoolClient } from 'pg';

export const fetchPendingOrders = async (filters: Partial<Order>): Promise<Order[]> => {
  const orders = await db.query(sql.fetchPendingOrders, filters);
  return orders.rows;
};

// export const updateOrderStatusByTransactionRefQuuery = async (filters: Partial<Order>): Promise<Order> => {
//     const order = await db.query(sql.updateOrderStatusByTransactionRef, filters);
//     return order.rows[0];
// };

export const updateOrderStatusByTransactionRef = async (transactionRef: string, status: string): Promise<Order> => {
  if (!transactionRef) {
    throw new Error('Transaction reference is required.');
  }

  if (!status) {
    throw new Error('Order status is required.');
  }

  const values = [status, new Date(), transactionRef];

  try {
    const { rows } = await db.query(sql.updateOrderStatusByTransactionRef, values);

    if (rows.length === 0) {
      throw new Error('Order not found.');
    }

    return rows[0]; // Return the updated order
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status.');
  }
};

export const createDeliveryNotes = async (client: PoolClient, userId: number, orderId: string) => {
  try {
    const user = await findUserById([userId] as Partial<User>);

    const orderWithMeals = await client.query(
      `
        SELECT * FROM orders o
        INNER JOIN order_meals om ON o.id = om.order_id
        WHERE o.id = $1
      `,
      [orderId]
    );

    if (orderWithMeals.rows[0].status !== 'paid') {
      throw new BadRequestError('Order must be in a paid status');
    }

    const rowsData = orderWithMeals.rows.map((row) => {
      const mealNo = row.delivery_type === 'one_time' ? row.number_of_meals : 1;
      return [
        generateDeliveryNoteCode(),
        `${user.first_name} ${user.last_name}`,
        user.phone_number,
        user.address,
        row.id,
        row.order_id,
        row.bundle_id,
        mealNo
      ];
    });

    const query = format(
      `
      INSERT INTO delivery_notes 
      (code, customer_name, customer_phone, address, order_meal_id, order_id, bundle_id, number_of_meals)
      VALUES %L RETURNING *
      `,
      rowsData
    );

    const deliveryNotes = await client.query(query);
    return deliveryNotes.rows;
  } catch (error) {
    console.error('Error creating delivery notes:', error);
    throw new Error(error.message || error || 'Failed to create delivery notes.');
  }
};

