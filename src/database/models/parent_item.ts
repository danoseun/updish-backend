import pool from '../../config/database.config';
import { logger } from '../../utilities';

const itemTable = `DROP TABLE IF EXISTS parent_items CASCADE;
        CREATE TABLE parent_items (
            id SERIAL PRIMARY KEY NOT NULL,
            admin_id INTEGER NOT NULL,
            name CHARACTER VARYING(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing parentItemtableHandler
 */
export async function createParentItemTable(): Promise<void> {
  try {
    const create = await pool.query(itemTable);
    console.log(`parentItemTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`parentItemTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`parentItemTable ${error}`);
    logger.error(`parentItemTable ${error}`);
  }
}
