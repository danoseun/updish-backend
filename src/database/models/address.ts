import pool from '../../config/database.config';
import { logger } from '../../utilities';

const addressTable = `DROP TABLE IF EXISTS addresses CASCADE;
        CREATE TABLE addresses (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            state CHARACTER VARYING(255),
            city CHARACTER VARYING(255),
            address TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing addressTableHandler
 */
export async function createAddressTable(): Promise<void> {
  try {
    const create = await pool.query(addressTable);
    console.log(`addressTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`addressTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`addressTable: ${error}`);
    logger.error(`addressTable: ${error}`);
  }
}
