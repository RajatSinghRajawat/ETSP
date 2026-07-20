import {
  createJobPost,
  getJobPost,
  getJobPosts,
  getMyJobPosts,
  updateJobPost,
} from '../controllers/job.controller.js';
import { authenticate, authenticateOptional } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { jobSchema } from '../validations/job.validation.js';

export async function jobRoutes(app) {
  app.get('/my', { preHandler: authenticate }, getMyJobPosts);
  app.get('/', { preHandler: authenticateOptional }, getJobPosts);
  app.get('/:id', getJobPost);
  app.post('/', {
    preHandler: [authenticate, validateBody(jobSchema)],
  }, createJobPost);
  app.put('/:id', {
    preHandler: [authenticate, validateBody(jobSchema)],
  }, updateJobPost);
}
