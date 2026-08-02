import { getBillingStatusHandler } from '../controllers/settings.controller.js';

/**
 * Public billing kill-switch. No auth — every visitor needs it to hide
 * pricing / upgrade CTAs when the admin turns subscriptions off.
 */
export async function billingStatusRoutes(app) {
  app.get('/', getBillingStatusHandler);
}
