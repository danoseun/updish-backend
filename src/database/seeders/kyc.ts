import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

const variables = [
  [
    1,
    'Male',
    '{Weight Loss, Build Muscle}', // Proper PostgreSQL array syntax
    'dietary preference',
    '{Hate allergies}',
    '{Health Concern, Health Concern Two}'
  ]
];

const sql = format(
  'INSERT INTO kycs (user_id, sex, health_goals, dietary_preferences, food_allergies, health_concerns) VALUES %L returning id',
  variables
);

/**
 * Function representing kycSeeder
 */
export async function seedKycs(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`KYCs ${result.command}ED`);
    logger.info(`KYCs ${result.command}ED`);
  } catch (error) {
    console.log(`KYCs: ${error}`);
    logger.error(`KYCs: ${error}`);
  }
}
