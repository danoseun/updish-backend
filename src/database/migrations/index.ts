import { createUserTable } from '../models';
import { createKycTable } from '../models';
//import { seedUsers } from '../seeders';

import { logger } from '../../utilities';

(async () => {
  try {
    await createUserTable();
    // await seedUsers();
    console.log('migration completed')
  } catch (error) {
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();


