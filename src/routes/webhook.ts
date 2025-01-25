import { Router } from 'express';

import { WebHookController } from '../controllers/webhook';
import { authenticate } from '../middleware/authenticate';

export const webhookRouter = Router();


webhookRouter.post('/webhooks',  WebHookController.handleWebhook());


