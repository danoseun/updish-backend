
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Define database connection parameters
const connection = {
    connectionString: process.env.DATABASE_URL
  };
  
  const databaseName = 'updish_dev';    // The database name you want to reset
  
  export async function resetDatabase() {
    // Connect to PostgreSQL without specifying a database
    const pool = new Pool(connection);
    await pool.connect();
  
    try {
      // Drop the database if it exists
      await pool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
      console.log(`Database '${databaseName}' dropped successfully.`);
  
      // Create the database
      await pool.query(`CREATE DATABASE ${databaseName}`);
      console.log(`Database '${databaseName}' created successfully.`);
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      // Close the connection
      //await pool.end();
    }
  }
  
  // Run the resetDatabase function
//   resetDatabase()
//     .then(() => console.log('Database reset complete'))
//     .catch((error) => console.error('Error:', error));