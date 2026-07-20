import {
  getMe,
  getUsage,
  postCancel,
  postCheckout,
  postConfirm,
} from '../controllers/subscription.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateBody } from '../middlewares/validate.js';
import { checkoutSchema, confirmSchema } from '../validations/subscription.validation.js';

export async function subscriptionRoutes(app) {
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole('employer', 'candidate'));

  app.get('/me', getMe);
  app.get('/usage', getUsage);
  app.post('/checkout', { preHandler: validateBody(checkoutSchema) }, postCheckout);
  app.post('/confirm', { preHandler: validateBody(confirmSchema) }, postConfirm);
  app.post('/cancel', postCancel);
}
