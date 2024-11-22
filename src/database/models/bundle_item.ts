import pool from '../../config/database.config';
import { logger } from '../../utilities';

const bundleItemTable = `DROP TABLE IF EXISTS bundle_items CASCADE;
        CREATE TABLE bundle_items (
            id SERIAL PRIMARY KEY,
            bundle_id INTEGER REFERENCES bundles(id) ON DELETE CASCADE,
            item VARCHAR(255) NOT NULL,
            qty INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing bundleItemTableHandler
 */
export async function createBundleItemTable(): Promise<void> {
  try {
    const create = await pool.query(bundleItemTable);
    console.log(`bundleItemTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`bundleItemTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`bundleItemTable ${error}`);
    logger.error(`bundleItemTable ${error}`);
  }
}
