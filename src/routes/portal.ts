import { Router } from 'express';

import { loginUserSchema } from '../validations/user';

import { UserController } from '../controllers/user';
import { authenticate } from '../middleware/authenticate';

export const portalRouter = Router();


portalRouter.post('/admin/auth/login', loginUserSchema, UserController.loginAdmin());


