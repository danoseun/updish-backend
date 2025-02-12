import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { loginUserSchema } from '../validations/user';
import { createParentItemSchema, createBundleSchema, createItemSchema, toggleItemStatusSchema } from '../validations/item';

import { UserController } from '../controllers/user';
import { ItemController } from '../controllers/item';
import { authenticateAdmin } from '../middleware/authenticate';

export const portalRouter = Router();


portalRouter.post('/admin/auth/login', loginUserSchema, UserController.loginAdmin());
portalRouter.post('/admin/bundles', authenticateAdmin(), fileUpload({ useTempFiles: true, limits: { fileSize: 10 * 1024 * 1024 } }), createBundleSchema, ItemController.createBundle());
portalRouter.get('/admin/bundles', authenticateAdmin(), ItemController.getAllBundles());
portalRouter.post('/admin/parent-items', authenticateAdmin(), createParentItemSchema, ItemController.createParentItem());
portalRouter.get('/admin/parent-items', ItemController.fetchAllParentItems());
portalRouter.get('/admin/uoms', ItemController.fetchAllUoms());
portalRouter.post('/admin/items', authenticateAdmin(), createItemSchema, ItemController.createItem());
// portalRouter.patch('/admin/items/status/:id', authenticateAdmin(), toggleItemStatusSchema, ItemController.toggleItemStatus());
portalRouter.patch('/admin/bundles/status/:id', authenticateAdmin(), ItemController.toggleBundleStatus());
portalRouter.get('/admin/items', ItemController.fetchAllItems());
portalRouter.get ('/admin/messages', UserController.getContactUsMessages());

