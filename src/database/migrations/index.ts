import { resetDatabase } from '../../config/local.config';
import { createUserTable } from '../models';
import { createKycTable } from '../models';
//import { seedUsers } from '../seeders';
import { createParentItemTable } from '../models';
import { createItemTable } from '../models';
import { createBundleTable } from '../models';
import { createBundleItemTable } from '../models';

import { logger } from '../../utilities';

(async () => {
  try {
    //await resetDatabase();
    await createUserTable();
    await createKycTable();
    // await seedUsers();
    await createParentItemTable();
    await createItemTable();
    await createBundleTable();
    await createBundleItemTable();
    console.log('migration completed')
  } catch (error) {
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();


