import { Router } from 'express';
import { createItemSchema } from '../validations/item';

import { ItemController } from '../controllers/item';
import { authenticate } from '../middleware/authenticate';

export const itemRouter = Router();


itemRouter.post('/items', createItemSchema, ItemController.createItem());
itemRouter.get('/items', authenticate(), ItemController.fetchAllItems());

