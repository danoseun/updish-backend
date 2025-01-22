import pool from '../../config/database.config';
import { logger } from '../../utilities';


const subscriptionTable = `DROP TABLE IF EXISTS subscriptions CASCADE;
        CREATE TABLE subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            order_id INTEGER,
            start_date DATE,
            end_date DATE,
            status VARCHAR(255) NOT NULL DEFAULT 'created',
            total_price NUMERIC NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing subscriptionTableHandler
 */
export async function createSubscriptionTable(): Promise<void> {
  try {
    const create = await pool.query(subscriptionTable);
    console.log(`subscriptionTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`subscriptionTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`subscriptionTable: ${error}`);
    logger.error(`subscriptionTable: ${error}`);
  }
}