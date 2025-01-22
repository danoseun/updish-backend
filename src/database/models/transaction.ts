import pool from '../../config/database.config';
import { logger } from '../../utilities';


const transactionTable = `DROP TABLE IF EXISTS transactions CASCADE;
        CREATE TABLE transactions (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            subscription_id INT REFERENCES subscriptions(id),
            amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50),
            transaction_reference VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

/**
 * Function representing transactionTableHandler
 */
export async function createTransactionTable(): Promise<void> {
  try {
    const create = await pool.query(transactionTable);
    console.log(`transactionTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`transactionTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`transactionTable: ${error}`);
    logger.error(`transactionTable: ${error}`);
  }
}