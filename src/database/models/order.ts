import pool from '../../config/database.config';
import { logger } from '../../utilities';


const orderTable = `DROP TABLE IF EXISTS orders CASCADE;
        CREATE TABLE orders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            start_date DATE,
            end_date DATE,
            status VARCHAR(255) NOT NULL DEFAULT 'created',
            total_price NUMERIC NOT NULL,
            code VARCHAR(6),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing orderTableHandler
 */
export async function createOrderTable(): Promise<void> {
  try {
    const create = await pool.query(orderTable);
    console.log(`orderTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`orderTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`orderTable: ${error}`);
    logger.error(`orderTable: ${error}`);
  }
}