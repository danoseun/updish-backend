import { Router } from 'express';
import { loginUserSchema } from '../validations/user';
import { authenticate } from '../middleware/authenticate';
import { DriverController } from '../controllers/driver';
import { DeliveryController } from '../controllers/delivery';

export const driverRouter = Router();
driverRouter.post('/drivers/login', loginUserSchema, DriverController.loginDriver());
driverRouter.post('/drivers/update-password', authenticate({ isDriver: true }), DriverController.changeDriverPassword());
driverRouter.get('/drivers/delivery-trips', authenticate({ isDriver: true }), DeliveryController.fetchDeliveryTripsByDriver());
driverRouter.get('/drivers/delivery-trips/notes/:code', authenticate({ isDriver: true }), DeliveryController.fetchDeliveryNotesByTripCode());
driverRouter.patch('/drivers/accept-reject-trip', authenticate({ isDriver: true }), DriverController.acceptOrRejectDeliveryTripByDriver());
driverRouter.patch('/drivers/update-delivery', authenticate({isDriver: true}), DriverController.updateDelivery())