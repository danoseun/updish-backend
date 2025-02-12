import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

/**
 * Helper function to convert JS array to PG array literal.
 */
function toPgArray(arr: string[]): string {
  const escaped = arr.map((val) => val.replace(/"/g, '\\"'));
  return `{${escaped.join(',')}}`;
}

const bundlesData = [
  [1, 'Morning Delight', toPgArray(['Low Fat', 'High Fiber']), toPgArray(['Breakfast']), '5.99', false, true],
  [1, 'Lunch Combo', toPgArray(['High Protein']), toPgArray(['Lunch']), '8.99', false, true],
  [1, 'Dinner Special', toPgArray(['Low Calorie']), toPgArray(['Dinner']), '10.50', false, true],
  [1, 'All Day Meal', toPgArray(['Balanced']), toPgArray(['Breakfast', 'Lunch', 'Dinner']), '12.99', false, true],
  [1, 'Quick Bite', toPgArray(['Low Fat']), toPgArray(['Lunch']), '6.50', false, true],
  [1, 'Evening Feast', toPgArray(['High Protein']), toPgArray(['Dinner']), '11.99', false, true],
  [1, 'Early Bird', toPgArray(['Low Calorie']), toPgArray(['Breakfast']), '4.99', false, true],
  [1, 'Family Meal', toPgArray(['Balanced', 'High Protein']), toPgArray(['Lunch', 'Dinner']), '15.99', false, true],
  [1, 'Vegetarian Special', toPgArray(['High Fiber', 'Low Fat']), toPgArray(['Lunch']), '9.99', false, true],
  [1, 'Gourmet Dinner', toPgArray(['Low Calorie', 'High Protein']), toPgArray(['Dinner']), '13.50', false, true]
];

const sql = format('INSERT INTO bundles (admin_id, name, health_impact, category, price, is_extra, is_active) VALUES %L returning id', bundlesData);

/**
 * Function representing the seeder for bundles.
 */
export async function seedBundles(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`bundles ${result.command}ED`);
    logger.info(`bundles ${result.command}ED`);
  } catch (error) {
    console.error(`seedBundles: ${error}`);
    logger.error(`seedBundles: ${error}`);
  }
}
