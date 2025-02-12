import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

const parentItems = [
  [1, 'Rice'],
  [1, 'Meat'],
  [1, 'Fish'],
  [1, 'Yam'],
  [1, 'Beans'],
  [1, 'Vegetables'],
  [1, 'Fruits'],
  [1, 'Snacks'],
  [1, 'Soup Bases'],
  [1, 'Beverages']
];


const sql = format(
  'INSERT INTO parent_items (admin_id, name) VALUES %L returning id',
  parentItems
);

/**
 * Function representing the seeder for parent_items.
 */
export async function seedParentItems(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`parent_items ${result.command}ED`);
    logger.info(`parent_items ${result.command}ED`);
  } catch (error) {
    console.error(`seedParentItems: ${error}`);
    logger.error(`seedParentItems: ${error}`);
  }
}
