import {
  getAddonCatalog,
  getMyPurchases,
  postPurchaseCheckout,
  postPurchaseConfirm,
} from '../controllers/purchase.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateBody } from '../middlewares/validate.js';
import {
  purchaseCheckoutSchema,
  purchaseConfirmSchema,
} from '../validations/purchase.validation.js';

export async function purchaseRoutes(app) {
  // Public add-on price catalog for the pricing page.
  app.get('/addons', getAddonCatalog);

  app.register(async (authed) => {
    authed.addHook('preHandler', authenticate);
    authed.addHook('preHandler', requireRole('employer', 'candidate'));

    authed.post('/checkout', { preHandler: validateBody(purchaseCheckoutSchema) }, postPurchaseCheckout);
    authed.post('/confirm', { preHandler: validateBody(purchaseConfirmSchema) }, postPurchaseConfirm);
    authed.get('/me', getMyPurchases);
  });
}
