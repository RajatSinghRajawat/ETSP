import {
  listLookupCategoriesHandler,
  listPublicLookupsHandler,
  proposeLookupHandler,
} from '../controllers/lookup-option.controller.js';
import { authenticateOptional } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { proposeLookupSchema } from '../validations/lookup-option.validation.js';

/**
 * Public catalog + user-submitted options.
 * GET  /lookups/categories
 * GET  /lookups/:category
 * POST /lookups/:category/propose  (public — auth is optional and only used to
 *      attribute the submission when a token happens to be present)
 */
export async function lookupOptionRoutes(app) {
  app.get('/categories', listLookupCategoriesHandler);
  app.get('/:category', listPublicLookupsHandler);
  app.post(
    '/:category/propose',
    {
      // Anyone can add a missing option, so this endpoint gets a tighter
      // per-IP budget than the global default.
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      preHandler: [authenticateOptional, validateBody(proposeLookupSchema)],
    },
    proposeLookupHandler,
  );
}
