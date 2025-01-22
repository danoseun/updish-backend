import pool from '../../config/database.config';
import { logger } from '../../utilities';

const adminTable = `DROP TABLE IF EXISTS admins CASCADE;
        CREATE TABLE admins (
            id SERIAL PRIMARY KEY NOT NULL,
            email CHARACTER VARYING(255),
            password TEXT,
            first_name CHARACTER VARYING(255),
            last_name CHARACTER VARYING(255),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing admintableHandler
 */
export async function createAdminTable(): Promise<void> {
  try {
    const create = await pool.query(adminTable);
    console.log(`adminTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`adminTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`adminTable ${error}`);
    logger.error(`adminTable ${error}`);
  }
}
