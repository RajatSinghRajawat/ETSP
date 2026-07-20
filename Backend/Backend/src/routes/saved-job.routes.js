import {
  deleteSavedJob,
  getSavedJobs,
  postSavedJob,
} from '../controllers/saved-job.controller.js';
import { authenticate } from '../middlewares/auth.js';

export async function savedJobRoutes(app) {
  app.get('/me', { preHandler: authenticate }, getSavedJobs);
  app.post('/', { preHandler: authenticate }, postSavedJob);
  app.delete('/:jobId', { preHandler: authenticate }, deleteSavedJob);
}
