import { resetDatabase } from '../../config/local.config';
import { createItemImagesTable, createUserTable } from '../models';
import { createKycTable } from '../models';
import { logger } from '../../utilities';
//import { seedUsers } from '../seeders';
import { createParentItemTable } from '../models';
import { createItemTable } from '../models';
import { createBundleTable } from '../models';
import { createBundleItemTable, createOrderTable, createorderMealsTable, createorderExtrasTable, createAddressTable, createAdminTable, createSubscriptionTable, createTransactionTable } from '../models';
import { seedAdmins } from '../seeders/admin';



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
    await createAdminTable();
    await seedAdmins();
    await createSubscriptionTable();
    await createTransactionTable();
    console.log('migration completed')
  } catch (error) {
    console.log(`ERROR IN MIGRATION ${error}`);
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();


