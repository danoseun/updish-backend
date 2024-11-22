import { Router } from 'express';
import { createItemSchema, createParentItemSchema, toggleItemStatusSchema, createBundleSchema } from '../validations/item';

import { ItemController } from '../controllers/item';
import { authenticate } from '../middleware/authenticate';

export const itemRouter = Router();

//should be authenticated via authenticate()
itemRouter.post('/items', createItemSchema, ItemController.createItem());
itemRouter.patch('items/:id', toggleItemStatusSchema, ItemController.toggleItemStatus());
itemRouter.get('/items', ItemController.fetchAllItems());
itemRouter.get('/uoms', ItemController.fetchAllUoms());
itemRouter.post('/parent-items', createParentItemSchema, ItemController.createParentItem());
itemRouter.get('/parent-items', ItemController.fetchAllParentItems());
itemRouter.post('/bundles', createBundleSchema, ItemController.createBundle());
itemRouter.get('/bundles', ItemController.getActiveBundles());

