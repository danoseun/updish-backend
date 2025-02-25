import pool from '../../config/database.config';
import { logger } from '../../utilities';

const deliveryTripsTable = `DROP TABLE IF EXISTS delivery_trips CASCADE;
    CREATE TABLE delivery_trips (
        id SERIAL PRIMARY KEY NOT NULL,
        code VARCHAR(50),
        driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
        status VARCHAR(255) NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    )`;

/**
 * Function representing deliveryTripsTableHandler
 */
export async function createDeliveryTripTable(): Promise<void> {
  try {
    const create = await pool.query(deliveryTripsTable);
    console.log(`deliveryTripsTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`deliveryTripsTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`deliveryTripsTable: ${error}`);
    logger.error(`deliveryTripsTable: ${error}`);
  }
}
