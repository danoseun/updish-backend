import pool from '../../config/database.config';
import { logger } from '../../utilities';

const itemTable = `DROP TABLE IF EXISTS items CASCADE;
        CREATE TABLE items (
            id SERIAL PRIMARY KEY NOT NULL,
            admin_id INTEGER NOT NULL,
            item_name CHARACTER VARYING(255),
            uom CHARACTER VARYING(255),
            allergies CHARACTER VARYING(255),
            class_of_food CHARACTER VARYING(255),
            calories_per_uom CHARACTER VARYING(255),
            parent_item CHARACTER VARYING(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing itemtableHandler
 */
export async function createItemTable(): Promise<void> {
  try {
    const create = await pool.query(itemTable);
    console.log(`itemTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`itemTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`itemTable ${error}`);
    logger.error(`itemTable ${error}`);
  }
}
