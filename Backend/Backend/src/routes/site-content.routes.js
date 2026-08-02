import { getSiteContentHandler } from '../controllers/settings.controller.js';

/**
 * Read-only copy of the admin-managed marketing content (contact details,
 * social links, About page text) for the public site. No auth: every visitor
 * needs it, and nothing here is sensitive.
 */
export async function siteContentRoutes(app) {
  app.get('/', getSiteContentHandler);
}
