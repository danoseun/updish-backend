import pool from '../../config/database.config';
import { logger } from '../../utilities';

const orderExtraTable = `DROP TABLE IF EXISTS order_extras CASCADE;
            CREATE TABLE order_extras (
                id SERIAL PRIMARY KEY,
                order_meal_id INTEGER REFERENCES order_meals(id) ON DELETE CASCADE,
                extra_name VARCHAR(255),
                quantity INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing orderExtrasTable
 */
export async function createorderExtrasTable(): Promise<void> {
  try {
    const create = await pool.query(orderExtraTable);
    console.log(`orderExtrasTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`orderExtrasTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`orderExtrasTable: ${error}`);
    logger.error(`orderExtrasTable: ${error}`);
  }
}
