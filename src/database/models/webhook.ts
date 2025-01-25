import pool from '../../config/database.config';
import { logger } from '../../utilities';


const webhookTable = `DROP TABLE IF EXISTS webhooks CASCADE;
        CREATE TABLE webhooks (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            order_id INT,
            amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50),
            transaction_reference VARCHAR(100),
            data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing webhookTableHandler
 */
export async function createWebhookTable(): Promise<void> {
  try {
    const create = await pool.query(webhookTable);
    console.log(`webhookTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`webhookTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`webhookTable: ${error}`);
    logger.error(`webhookTable: ${error}`);
  }
}