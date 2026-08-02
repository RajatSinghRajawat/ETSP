import { listPublicLookupsHandler } from '../controllers/lookup-option.controller.js';
import { LEGACY_LOOKUP_PATH_TO_CATEGORY } from '../constants/lookup-categories.js';

/**
 * Backward-compatible public list endpoints for the four original lookup
 * collections. Writes were removed — use /lookups/:category/propose or admin.
 */
function legacyListRoutes(category) {
  return async function resourceRoutes(app) {
    app.get('/', async (request, reply) => {
      request.params = { ...request.params, category };
      return listPublicLookupsHandler(request, reply);
    });
  };
}

export const jobTypeRoutes = legacyListRoutes(LEGACY_LOOKUP_PATH_TO_CATEGORY['job-types']);
export const skillRoutes = legacyListRoutes(LEGACY_LOOKUP_PATH_TO_CATEGORY.skills);
export const educationRoutes = legacyListRoutes(LEGACY_LOOKUP_PATH_TO_CATEGORY.educations);
export const salaryUnitRoutes = legacyListRoutes(LEGACY_LOOKUP_PATH_TO_CATEGORY['salary-units']);
