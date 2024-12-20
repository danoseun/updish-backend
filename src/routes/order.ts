import { Router } from 'express';

import { OrderController } from '../controllers/order';
import { authenticate } from '../middleware/authenticate';

export const orderRouter = Router();

//should be authenticated via authenticate()
orderRouter.post('/orders', OrderController.createOrder());


