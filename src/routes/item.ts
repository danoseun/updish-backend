import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { createItemSchema, createParentItemSchema, toggleItemStatusSchema, createBundleSchema, findItemByIdDetailedSchema } from '../validations/item';

import { ItemController } from '../controllers/item';
import { authenticate } from '../middleware/authenticate';

export const itemRouter = Router();

//should be authenticated via authenticate()
itemRouter.post('/items', fileUpload({ useTempFiles: true, limits: { fileSize: 10 * 1024 * 1024 } }), createItemSchema, ItemController.createItem());
itemRouter.patch('/items/status/:id', toggleItemStatusSchema, ItemController.toggleItemStatus());
itemRouter.get('/items/:id/detailed', findItemByIdDetailedSchema, ItemController.findItemByIdDetailed());
itemRouter.get('/items', ItemController.fetchAllItems());
itemRouter.get('/items/category', ItemController.getAllItemsByCategory());
itemRouter.get('/uoms', ItemController.fetchAllUoms());
itemRouter.post('/parent-items', createParentItemSchema, ItemController.createParentItem());
itemRouter.get('/parent-items', ItemController.fetchAllParentItems());
itemRouter.post('/bundles', createBundleSchema, ItemController.createBundle());
itemRouter.get('/bundles', ItemController.getActiveBundles());
itemRouter.get('/bundles/:id', ItemController.getBundleById());

