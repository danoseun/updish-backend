import pool from '../../config/database.config';
import format from 'pg-format';
import bcrypt from 'bcrypt';
import variable from '../../variables';
import { logger } from '../../utilities';



// Email:  seun@tryupdish.com
// Password: Passpass54@

// daniel@tryupdish.com
// Password09@

const hashedPassword = bcrypt.hashSync('Passpass54@', variable.auth.rounds);
const hashedPasswordTwo = bcrypt.hashSync('Password09@', variable.auth.rounds);


const variables = [
  ['seun@tryupdish.com', hashedPassword, 'Customer', 'One', '+2347033288348', 'Lugbe', 'Abuja', '1B Bamba Road, Lugbe'],
  ['daniel@tryupdish.com', hashedPasswordTwo, 'Daniel-One', 'Nduka', '+2348112345674', 'Asokoro', 'Abuja', '55 Abiola Way, Asokoro'],
  ['yigoyer379@perceint.com', hashedPasswordTwo, 'Daniel-Two', 'Nduka', '+2348112345674', 'Lafia', 'Nassarawa', '1B Keffi Crescent, Lafia'],
  ['xemah78459@prorsd.com', hashedPasswordTwo, 'Daniel-Three', 'Nduka', '+2348112345674', 'Gwarimpa', 'Abuja', '20 Billings Way, Gwarimpa']
];

const sql = format('INSERT INTO users (email, password, first_name, last_name, phone_number, state, city, address) VALUES %L returning id', variables);

/**
 * Function representing usersSeeder
 */
export async function seedUsers(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`Users ${result.command}ED`);
    logger.info(`Users ${result.command}ED`);
  } catch (error) {
    console.log(`seedUsers: ${error}`);
    logger.error(`seedUsers: ${error}`);
  }
}
