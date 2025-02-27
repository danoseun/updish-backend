import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { createDriverSchema, loginUserSchema } from '../validations/user';
import { createParentItemSchema, createBundleSchema, createItemSchema } from '../validations/item';

import { UserController } from '../controllers/user';
import { ItemController } from '../controllers/item';
import { authenticateAdmin } from '../middleware/authenticate';
import { DriverController } from '../controllers/driver';
import { OrderController } from '../controllers/order';
import { DeliveryController } from '../controllers/delivery';

export const portalRouter = Router();

portalRouter.post('/admin/auth/login', loginUserSchema, UserController.loginAdmin());
portalRouter.post(
  '/admin/bundles',
  authenticateAdmin(),
  fileUpload({ useTempFiles: true, limits: { fileSize: 10 * 1024 * 1024 } }),
  createBundleSchema,
  ItemController.createBundle()
);
portalRouter.get('/admin/bundles', authenticateAdmin(), ItemController.getAllBundles());
portalRouter.post('/admin/parent-items', authenticateAdmin(), createParentItemSchema, ItemController.createParentItem());
portalRouter.get('/admin/parent-items', ItemController.fetchAllParentItems());
portalRouter.get('/admin/uoms', ItemController.fetchAllUoms());
portalRouter.post('/admin/items', authenticateAdmin(), createItemSchema, ItemController.createItem());
// portalRouter.patch('/admin/items/status/:id', authenticateAdmin(), toggleItemStatusSchema, ItemController.toggleItemStatus());
portalRouter.patch('/admin/bundles/status/:id', authenticateAdmin(), ItemController.toggleBundleStatus());
portalRouter.get('/admin/items', ItemController.fetchAllItems());
portalRouter.get('/admin/messages', UserController.getContactUsMessages());
portalRouter.post('/admin/drivers', authenticateAdmin(), createDriverSchema, DriverController.createDriver());
portalRouter.get('/admin/delivery-notes', authenticateAdmin(), DeliveryController.fetchDeliveryNotes());
portalRouter.get('/admin/drivers', authenticateAdmin(), DriverController.fetchDrivers());
portalRouter.post('/admin/delivery-trips', authenticateAdmin(), DeliveryController.createDeliveryTrips());
portalRouter.post('/admin/driver-trip-assignment', authenticateAdmin(), DeliveryController.assignDeliveryTripToDriver());
