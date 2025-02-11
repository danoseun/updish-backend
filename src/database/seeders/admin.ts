import pool from '../../config/database.config';
import format from 'pg-format';
import bcrypt from 'bcrypt';
import variable from '../../variables';
import { logger } from '../../utilities';



// Email:  hycenth@tryupdish.com
// Password: 15eNE]2n~Q


const hashedPassword = bcrypt.hashSync('15eNE]2n~Q', variable.auth.rounds);
const hashedPasswordTwo = bcrypt.hashSync('admin', variable.auth.rounds);
const hashedPasswordThree = bcrypt.hashSync('Updish@1#', variable.auth.rounds);


const variables = [
  ['hycenth@tryupdish.com', hashedPassword, 'Hycenth', 'Admin'],
  ['segunoz1@gmail.com', hashedPasswordTwo, 'Segun', 'Admin'],
  ['anitaupdish@gmail.com', hashedPasswordThree, 'Anita', 'Admin']
];
const sql = format('INSERT INTO admins (email, password, first_name, last_name) VALUES %L returning id', variables);

/**
 * Function representing adminsSeeder
 */
export async function seedAdmins(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`Admins ${result.command}ED`);
    logger.info(`Admins ${result.command}ED`);
  } catch (error) {
    console.log(`seedAdmins: ${error}`);
    logger.error(`seedAdmins ${error}`);
  }
}
