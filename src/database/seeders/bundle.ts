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
  [1, 'Morning Delight', toPgArray(['Weight Loss', 'Gain Weight']), toPgArray(['Breakfast']), '5.99', false, true],
  [1, 'Lunch Combo', toPgArray(['Weight Loss', 'High Protein', 'Improve Overall Health']), toPgArray(['Lunch']), '8.99', false, true],
  [1, 'Dinner Special', toPgArray(['Gain Weight', 'Low Calorie']), toPgArray(['Dinner']), '10.50', false, true],
  [1, 'All Day Meal', toPgArray(['Balanced', 'Gain Weight']), toPgArray(['Breakfast', 'Lunch', 'Dinner']), '12.99', false, true],
  [1, 'Quick Bite', toPgArray(['Low Fat', 'Weight Loss', 'Gain Weight']), toPgArray(['Lunch']), '6.50', false, true],
  [1, 'Evening Feast', toPgArray(['High Protein', 'Gain Weight']), toPgArray(['Dinner']), '11.99', false, true],
  [1, 'Early Bird', toPgArray(['Low Calorie', 'Weight Loss', 'Gain Weight']), toPgArray(['Breakfast']), '4.99', false, true],
  [1, 'Family Meal', toPgArray(['Increase Energy', 'High Protein', 'Manage Blood Sugar', 'Gain Weight']), toPgArray(['Lunch', 'Dinner']), '15.99', false, true],
  [1, 'Vegetarian Special', toPgArray(['High Fiber', 'Low Fat', 'Weight Loss']), toPgArray(['Lunch']), '9.99', false, true],
  [1, 'Gourmet Dinner', toPgArray(['Low Calorie', 'High Protein', 'Weight Loss']), toPgArray(['Dinner']), '13.50', false, true]
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
