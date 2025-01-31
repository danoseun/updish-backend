import { Router } from 'express';
import { createItemSchema, createParentItemSchema, toggleItemStatusSchema, findItemByIdDetailedSchema } from '../validations/item';

import { ItemController } from '../controllers/item';
import { authenticateAdmin } from '../middleware/authenticate';

export const itemRouter = Router();

//should be authenticated via authenticate()
itemRouter.post('/items', authenticateAdmin(), createItemSchema, ItemController.createItem());
itemRouter.get('/items/:id/detailed', findItemByIdDetailedSchema, ItemController.findItemByIdDetailed());
itemRouter.get('/items', ItemController.fetchAllItems());
itemRouter.get('/items/category', ItemController.getAllItemsByCategory());
itemRouter.get('/bundles', ItemController.getActiveBundles());
itemRouter.get('/bundles/:id', ItemController.getBundleById());

