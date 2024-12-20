import pool from '../../config/database.config';
import { logger } from '../../utilities';

const itemImagesTable = `DROP TABLE IF EXISTS item_images CASCADE;
        CREATE TABLE item_images (
            id SERIAL PRIMARY KEY NOT NULL,
            item_id INTEGER NOT NULL,
            public_id TEXT NOT NULL,
            image_url TEXT NOT NULL,                                                                                                                                                                                                                                                                                                                                                                                              
            FOREIGN KEY (item_id) references items (id) on delete cascade,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing itemImagestableHandler
 */
export async function createItemImagesTable(): Promise<void> {
  try {
    const create = await pool.query(itemImagesTable);
    console.log(`itemImagesTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`itemImagesTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`itemImagesTable: ${error}`);
    logger.error(`itemImagesTable: ${error}`);
  }
}
