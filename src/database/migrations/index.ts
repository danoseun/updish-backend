import { resetDatabase } from '../../config/local.config';
import { createItemImagesTable, createUserTable } from '../models';
import { createKycTable } from '../models';
//import { seedUsers } from '../seeders';
import { createParentItemTable } from '../models';
import { createItemTable } from '../models';
import { createBundleTable } from '../models';
import { createBundleItemTable, createOrderTable, createorderMealsTable, createorderExtrasTable, createAddressTable } from '../models';


import { logger } from '../../utilities';

(async () => {
  try {
    //await resetDatabase();
    await createUserTable();
    await createKycTable();
    // await seedUsers();
    await createParentItemTable();
    await createItemTable();
    await createItemImagesTable();
    await createBundleTable();
    await createBundleItemTable();
    await createOrderTable();
    await createorderMealsTable();
    await createorderExtrasTable();
    await createAddressTable();
    console.log('migration completed')
  } catch (error) {
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();


