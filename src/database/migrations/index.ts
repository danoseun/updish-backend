import { resetDatabase } from '../../config/local.config';
import { createBundleImagesTable, createUserTable } from '../models';
import { createKycTable } from '../models';
import { logger } from '../../utilities';
//import { seedUsers } from '../seeders';
import { createParentItemTable } from '../models';
import { createItemTable } from '../models';
import { createBundleTable } from '../models';
import {
  createBundleItemTable,
  createOrderTable,
  createorderMealsTable,
  createorderExtrasTable,
  createAddressTable,
  createAdminTable,
  createSubscriptionTable,
  createWebhookTable,
  createPaymentPlanTable,
  createContactUsTable
} from '../models';
import { seedAdmins, seedUsers, seedKycs } from '../seeders';
import { seedParentItems } from '../seeders/parent_items';
import { seedItems } from '../seeders/items';
import { seedBundles } from '../seeders/bundle';
import { seedBundleItems } from '../seeders/bundle_items';
import { seedBundleImages } from '../seeders/bundle_images';

(async () => {
  try {
    //await resetDatabase();
    await createUserTable();
    await seedUsers();
    await createKycTable();
    await seedKycs();
    await createParentItemTable();
    await seedParentItems();
    await createItemTable();
    await seedItems();
    await createBundleTable();
    await seedBundles();
    await createBundleItemTable();
    await seedBundleItems();
    await createBundleImagesTable();
    await seedBundleImages();
    await createOrderTable();
    await createPaymentPlanTable();
    await createorderMealsTable();
    await createorderExtrasTable();
    await createAddressTable();
    await createAdminTable();
    await seedAdmins();
    await createSubscriptionTable();
    await createWebhookTable();
    await createContactUsTable();
    console.log('migration completed');
  } catch (error) {
    console.log(`ERROR IN MIGRATION ${error}`);
    logger.error(`ERROR IN MIGRATION ${error}`);
  }
})();
