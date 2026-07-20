import { getPublicPlans } from '../controllers/plan.controller.js';

// Public pricing data — consumed by the pricing pages, no auth required.
export async function planRoutes(app) {
  app.get('/', getPublicPlans);
}
