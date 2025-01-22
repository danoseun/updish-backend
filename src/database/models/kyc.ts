import pool from "../../config/database.config";
import { logger } from "../../utilities";

const kycTable = `DROP TABLE IF EXISTS kycs CASCADE;
        CREATE TABLE kycs (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id INTEGER NOT NULL,
            sex CHARACTER VARYING(255),
            health_goals CHARACTER VARYING(255)[],
            dietary_preferences TEXT,
            food_allergies CHARACTER VARYING(255)[],
            health_concerns CHARACTER VARYING(255)[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        )`;

/**
 * Function representing kyctableHandler
 */
export async function createKycTable(): Promise<void> {
  try {
    const create = await pool.query(kycTable);
    console.log(`kycTable: ${create[0].command}PED and ${create[1].command}D`);
    logger.info(`kycTable: ${create[0].command}PED and ${create[1].command}D`);
  } catch (error) {
    console.error(`kycTable ${error}`);
    logger.error(`kycTable ${error}`);
  }
}
