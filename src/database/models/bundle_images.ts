import pool from '../../config/database.config';
import { logger } from '../../utilities';

const bundleImagesTable = `DROP TABLE IF EXISTS bundle_images CASCADE;
        CREATE TABLE bundle_images (
            id SERIAL PRIMARY KEY NOT NULL,
            bundle_id INTEGER NOT NULL,
            public_id TEXT NOT NULL,
            image_url TEXT NOT NULL,                                                                                                                                                                                                                                                                                                                                                                                              
            FOREIGN KEY (bundle_id) references bundles (id) on delete cascade,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing bundleImagestableHandler
 */
export async function createBundleImagesTable(): Promise<void> {
  try {
    const create = await pool.query(bundleImagesTable);
    console.log(`bundleImagesTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`bundleImagesTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`bundleImagesTable: ${error}`);
    logger.error(`bundleImagesTable: ${error}`);
  }
}
