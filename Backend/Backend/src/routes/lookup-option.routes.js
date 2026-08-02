import {
  listLookupCategoriesHandler,
  listPublicLookupsHandler,
  proposeLookupHandler,
} from '../controllers/lookup-option.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { proposeLookupSchema } from '../validations/lookup-option.validation.js';

/**
 * Public catalog + user proposals.
 * GET  /lookups/categories
 * GET  /lookups/:category
 * POST /lookups/:category/propose  (auth)
 */
export async function lookupOptionRoutes(app) {
  app.get('/categories', listLookupCategoriesHandler);
  app.get('/:category', listPublicLookupsHandler);
  app.post(
    '/:category/propose',
    { preHandler: [authenticate, validateBody(proposeLookupSchema)] },
    proposeLookupHandler,
  );
}
