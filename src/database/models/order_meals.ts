import pool from '../../config/database.config';
import { logger } from '../../utilities';

const orderExtraTable = `DROP TABLE IF EXISTS order_meals CASCADE;
            CREATE TABLE order_meals (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                category meal_category NOT NULL,
                bundle_id INTEGER REFERENCES bundles(id),
                quantity INTEGER,
                delivery_time VARCHAR(50),
                location TEXT,
                code VARCHAR(6),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`;

/**
 * Function representing orderMealsTable
 */
export async function createorderMealsTable(): Promise<void> {
  try {
    const create = await pool.query(orderExtraTable);
    console.log(`orderMealsTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`orderMealsTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`orderMealsTable: ${error}`);
    logger.error(`orderMealsTable: ${error}`);
  }
}

