import { Router } from 'express';

import { OrderController } from '../controllers/order';
import { authenticate } from '../middleware/authenticate';

export const orderRouter = Router();

//should be authenticated via authenticate()
orderRouter.post('/orders', authenticate(), OrderController.createOrder());
orderRouter.get('/orders', OrderController.getOrders());
orderRouter.get('/demand-summary', OrderController.demandSummary());
orderRouter.get('/orders/:code', OrderController.getSalesOrder());
orderRouter.get('/last-order/:code', authenticate(), OrderController.getLastOrder());
orderRouter.patch('/update-order', authenticate(), OrderController.updateOrderMeals());


/** GET /orders
 * /orders?page=1&limit=20
 * /orders?date=2024-12-21&page=2&limit=10
 * /orders?startDate=2024-12-01&endDate=2024-12-10&page=3&limit=5
 * 
 * GET /demand-summary
 * /demand-summary?singleDate=2024-12-25
 * /demand-summary?startDate=2024-12-01&endDate=2024-12-31
 * /demand-summary?startDate=2024-12-01&endDate=2024-12-31&deliveryTime=morning
 */