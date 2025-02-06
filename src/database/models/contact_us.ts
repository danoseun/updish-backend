import pool from '../../config/database.config';
import { logger } from '../../utilities';

const contactUsTable = `DROP TABLE IF EXISTS contact_us CASCADE;
        CREATE TABLE contact_us (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing contactUsTableHandler
 */
export async function createContactUsTable(): Promise<void> {
  try {
    const create = await pool.query(contactUsTable);
    console.log(`contactUsTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`contactUsTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`contactUsTable ${error}`);
    logger.error(`contactUsTable ${error}`);
  }
}
