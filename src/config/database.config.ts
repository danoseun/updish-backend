import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utilities';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const DATABASE_URL = 
  NODE_ENV === 'production' ? process.env.DATABASE_URL_PROD :
  NODE_ENV === 'staging' ? process.env.DATABASE_URL_STAGING :
  process.env.DATABASE_URL_DEV;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set!");
}

let connection: PoolConfig = { connectionString: DATABASE_URL };

console.log('HERE', DATABASE_URL, NODE_ENV);

// Optionally enable SSL for production/staging
if (NODE_ENV === 'staging' || NODE_ENV === 'production') {
  connection = {
    ...connection,
    // ssl: { rejectUnauthorized: false }  // Uncomment if required
  };
}

const pool = new Pool({
  ...connection,
  connectionTimeoutMillis: 10000
});

export const connect = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the DB');
    // logger.info('Successfully connected to the DB');
    client.release();
  } catch (error) {
    console.log(`DB connection error: ${error}`);
    // logger.error(`DB connection error: ${error}`);
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

