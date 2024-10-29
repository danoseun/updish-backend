import pg from 'pg';
import pool from '../config/database.config';
import { logger } from '../utilities';


export default {
  /**
     * DB Abstraction
     * @param {string} text
     * @param {string} params
     *
     */

  async query(text:string, params?:any): Promise<pg.QueryResult> {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      logger.error(`DB: ${error.message}`);
    }
  }
};