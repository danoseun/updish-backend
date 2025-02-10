import pool from '../../config/database.config';
import { logger } from '../../utilities';

const bundleTable = `
       DROP TABLE IF EXISTS bundles CASCADE;
        CREATE TABLE bundles (
            id SERIAL PRIMARY KEY NOT NULL,
            admin_id INTEGER,
            name VARCHAR(255) NOT NULL,
            health_impact TEXT[],
            category VARCHAR(255) NOT NULL,
            price VARCHAR(50),
            is_extra BOOLEAN,
            is_active BOOLEAN,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing bundletableHandler
 */
export async function createBundleTable(): Promise<void> {
  try {
    const create = await pool.query(bundleTable);
    console.log(`bundleTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`bundleTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`bundleTable ${error}`);
    logger.error(`bundleTable ${error}`);
  }
}
