import pool from '../../config/database.config';
import { logger } from '../../utilities';

const userTable = `DROP TABLE IF EXISTS users CASCADE;
        CREATE TABLE users (
            id SERIAL PRIMARY KEY NOT NULL,
            email CHARACTER VARYING(255),
            password TEXT,
            first_name CHARACTER VARYING(255),
            last_name CHARACTER VARYING(255),
            phone_number CHARACTER VARYING(255),
            age CHARACTER VARYING(255),
            state CHARACTER VARYING(255),
            city CHARACTER VARYING(255),
            address TEXT,
            latitude DECIMAL(9, 6),
            longitude DECIMAL(9, 6),
            is_email_verified BOOLEAN,
            is_phone_number_verified BOOLEAN,
            identity_verified BOOLEAN,
            is_active BOOLEAN DEFAULT true,
            deactivated_at TIMESTAMP,
            deletion_scheduled_at TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing usertableHandler
 */
export async function createUserTable(): Promise<void> {
  try {
    const create = await pool.query(userTable);
    console.log(`userTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`userTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`userTable ${error}`);
    logger.error(`userTable ${error}`);
  }
}
