import pool from '../../config/database.config';
import { logger } from '../../utilities';

const deliveryNotesTable = `DROP TABLE IF EXISTS delivery_notes CASCADE;
    CREATE TABLE delivery_notes (
        id SERIAL PRIMARY KEY NOT NULL,
        code VARCHAR(50),
        order_meal_id INTEGER REFERENCES order_meals(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        customer_name CHARACTER VARYING(255),
        customer_phone CHARACTER VARYING(255),
        address TEXT,
        bundle_id CHARACTER VARYING(255),
        delivery_trip_id INTEGER REFERENCES delivery_trips(id) ON DELETE CASCADE,
        number_of_meals INT NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    )`;

/**
 * Function representing deliveryNotesTableHandler
 */
export async function createDeliveryNoteTable(): Promise<void> {
  try {
    const create = await pool.query(deliveryNotesTable);
    console.log(`deliveryNotesTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`deliveryNotesTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`deliveryNotesTable: ${error}`);
    logger.error(`deliveryNotesTable: ${error}`);
  }
}
