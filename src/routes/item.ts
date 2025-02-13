import { Router } from 'express';
import { createItemSchema, createParentItemSchema, toggleItemStatusSchema, findItemByIdDetailedSchema, getBundleByIdSchema } from '../validations/item';

import { ItemController } from '../controllers/item';
import { authenticate } from '../middleware/authenticate';

export const itemRouter = Router();

//should be authenticated via authenticate()
itemRouter.get('/meal-bundles', authenticate(), ItemController.getActiveBundles());
itemRouter.get('/items/:id/detailed', findItemByIdDetailedSchema, ItemController.findItemByIdDetailed());
itemRouter.get('/items/category', ItemController.getAllItemsByCategory());
itemRouter.get('/bundles', ItemController.getActiveBundles());
itemRouter.get('/bundles/:id', getBundleByIdSchema, ItemController.getBundleById());

