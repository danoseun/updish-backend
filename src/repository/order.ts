import db from '../database/query';
import { sql } from '../database/sql';
import { Order } from '../interfaces'


export const fetchPendingOrders = async (filters: Partial<Order>): Promise<Order[]> => {
    const orders = await db.query(sql.fetchPendingOrders, filters);
    return orders.rows;
};

// export const updateOrderStatusByTransactionRefQuuery = async (filters: Partial<Order>): Promise<Order> => {
//     const order = await db.query(sql.updateOrderStatusByTransactionRef, filters);
//     return order.rows[0];
// };

export const updateOrderStatusByTransactionRef = async (
    transactionRef: string,
    status: string
  ): Promise<Order> => {
    if (!transactionRef) {
      throw new Error("Transaction reference is required.");
    }
  
    if (!status) {
      throw new Error("Order status is required.");
    }
  

    const values = [status, new Date(), transactionRef];
  
    try {
      const { rows } = await db.query(sql.updateOrderStatusByTransactionRef, values);
  
      if (rows.length === 0) {
        throw new Error("Order not found.");
      }
  
      return rows[0]; // Return the updated order
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status.");
    }
  };