import pool from '../../config/database.config';
import { logger } from '../../utilities';

const driverTable = `DROP TABLE IF EXISTS drivers CASCADE;
    CREATE TABLE drivers (
        id SERIAL PRIMARY KEY NOT NULL,
        email CHARACTER VARYING(255),
        password CHARACTER VARYING(255),
        first_name CHARACTER VARYING(255),
        last_name CHARACTER VARYING(255),
        phone_number CHARACTER VARYING(255),
        is_password_updated BOOLEAN DEFAULT false,
        third_party_logistics CHARACTER VARYING(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    )`;

/**
 * Function representing driverTableHandler
 */
export async function createdriverTable(): Promise<void> {
  try {
    const create = await pool.query(driverTable);
    console.log(`driverTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`driverTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`driverTable: ${error}`);
    logger.error(`driverTable: ${error}`);
  }
}
