import { resetDatabase } from '../../config/local.config';
import { createUserTable } from '../models';
import { createKycTable } from '../models';
//import { seedUsers } from '../seeders';
import { createItemTable } from '../models';

import { logger } from '../../utilities';

(async () => {
  try {
    //await resetDatabase();
    await createUserTable();
    await createKycTable();
    // await seedUsers();
    await createItemTable();
    console.log('migration completed')
  } catch (error) {
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();


