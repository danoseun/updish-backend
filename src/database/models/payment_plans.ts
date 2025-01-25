import pool from '../../config/database.config';
import { logger } from '../../utilities';


const paymentPlanTable = `DROP TABLE IF EXISTS payment_plans CASCADE;
        CREATE TABLE payment_plans (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            payment_plan_id VARCHAR(50) NOT NULL,
            amount NUMERIC NOT NULL,
            interval VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing paymentPlanTableHandler
 */
export async function createPaymentPlanTable(): Promise<void> {
  try {
    const create = await pool.query(paymentPlanTable);
    console.log(`paymentPlanTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`paymentPlanTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`paymentPlanTable: ${error}`);
    logger.error(`paymentPlanTable: ${error}`);
  }
}
