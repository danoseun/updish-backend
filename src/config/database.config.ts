import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

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

export default pool;
