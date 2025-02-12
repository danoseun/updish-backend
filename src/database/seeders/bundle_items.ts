import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

const bundleItemsData = [
  [1, 1, 2],
  [1, 2, 1],
  [2, 3, 1],
  [2, 4, 2],
  [3, 5, 1],
  [3, 6, 2],
  [4, 7, 3],
  [4, 8, 1],
  [5, 9, 2],
  [6, 10, 1],
  [7, 11, 2],
  [8, 12, 2],
  [8, 13, 1],
  [9, 14, 2],
  [10, 15, 1]
];

const sql = format('INSERT INTO bundle_items (bundle_id, item, qty) VALUES %L returning id', bundleItemsData);

/**
 * Seed function for bundle_items.
 */
export async function seedBundleItems(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`bundle_items ${result.command}ED`);
    logger.info(`bundle_items ${result.command}ED`);
  } catch (error) {
    console.error(`seedBundleItems: ${error}`);
    logger.error(`seedBundleItems: ${error}`);
  }
}
