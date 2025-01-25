import pool from '../../config/database.config';
import { logger } from '../../utilities';

const bundleTable = `
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_category') THEN
              CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner');
          END IF;
        END $$;

        DROP TABLE IF EXISTS bundles CASCADE;
        CREATE TABLE bundles (
            id SERIAL PRIMARY KEY NOT NULL,
            admin_id INTEGER,
            name VARCHAR(255) NOT NULL,
            health_impact VARCHAR(255) NOT NULL,
            category meal_category NOT NULL,
            price VARCHAR(50),
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
