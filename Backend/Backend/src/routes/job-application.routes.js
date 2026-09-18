import {
  createApplication,
  getAutoApply,
  getMyApplicationStatus,
  getMyApplications,
  getMyEmployerApplication,
  getMyEmployerApplicationCounts,
  getMyEmployerApplications,
  patchEmployerApplication,
  patchEmployerApplicationInterest,
  postAutoApply,
} from '../controllers/job-application.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  applicationInterestSchema,
  applicationStatusUpdateSchema,
  autoApplySchema,
  jobApplicationSchema,
} from '../validations/job-application.validation.js';

export async function jobApplicationRoutes(app) {
  app.post('/', {
    preHandler: [authenticate, validateBody(jobApplicationSchema)],
  }, createApplication);
  app.get('/me', { preHandler: authenticate }, getMyApplications);
  app.get('/me/job/:jobId', { preHandler: authenticate }, getMyApplicationStatus);

  // AI auto apply (candidate plan feature) — status + toggle. Enabling runs
  // an immediate sweep over existing matching jobs.
  app.get('/auto-apply', { preHandler: authenticate }, getAutoApply);
  app.post('/auto-apply', {
    preHandler: [authenticate, validateBody(autoApplySchema)],
  }, postAutoApply);

  app.get('/employer', { preHandler: authenticate }, getMyEmployerApplications);
  // Declared before '/employer/:id' so "counts" is not read as an application id.
  app.get('/employer/counts', { preHandler: authenticate }, getMyEmployerApplicationCounts);
  app.get('/employer/:id', { preHandler: authenticate }, getMyEmployerApplication);
  app.patch('/employer/:id', {
    preHandler: [authenticate, validateBody(applicationStatusUpdateSchema)],
  }, patchEmployerApplication);
  app.patch('/employer/:id/interest', {
    preHandler: [authenticate, validateBody(applicationInterestSchema)],
  }, patchEmployerApplicationInterest);
}
