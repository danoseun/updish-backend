import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utilities';

dotenv.config();

let connection: PoolConfig;

if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
  connection = {
    connectionString: process.env.DATABASE_URL,
    // ssl: {
    //   /* <----- Add SSL option */ rejectUnauthorized: false
    // }
  };
} else {
  connection = {
    connectionString: process.env.DATABASE_URL
  };
}

const pool = new Pool({
  ...connection,
  connectionTimeoutMillis: 10000
});

export const connect = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('successfully connected to the DB');
    //logger.info('successfully connected to the DB');
    client.release();
  } catch (error) {
    console.log(`DB connection error: ${error}`);
    //logger.error(`DB connection error: ${error}`);
    process.exit(1);
  }
};

export const disconnect = async (): Promise<void> => {
  try {
    await pool.end(); // Close all connections
    logger.info("DB connection pool has been closed");
  } catch (error) {
    logger.error(`Error closing DB connections: ${error}`);
  }
};

export default pool;
