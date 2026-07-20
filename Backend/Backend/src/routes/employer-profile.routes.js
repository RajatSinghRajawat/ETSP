import {
  createProfile,
  getMyProfile,
  getPrefill,
  getProfile,
  getProfiles,
  updateMyProfile,
  uploadLogo,
} from '../controllers/employer-profile.controller.js';
import {
  deleteFollowEmployer,
  postFollowEmployer,
} from '../controllers/follow.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  employerProfileSchema,
  employerProfileUpdateSchema,
} from '../validations/employer-profile.validation.js';

export async function employerProfileRoutes(app) {
  app.post('/logo', uploadLogo);
  app.get('/prefill', getPrefill);
  app.get('/me', { preHandler: authenticate }, getMyProfile);
  app.patch('/me', {
    preHandler: [authenticate, validateBody(employerProfileUpdateSchema)],
  }, updateMyProfile);
  app.post('/', { preHandler: validateBody(employerProfileSchema) }, createProfile);
  app.get('/', getProfiles);
  app.get('/:id', getProfile);
  // EXCEL candidate feature: follow an employer for new-job email updates.
  app.post('/:id/follow', { preHandler: authenticate }, postFollowEmployer);
  app.delete('/:id/follow', { preHandler: authenticate }, deleteFollowEmployer);
}
