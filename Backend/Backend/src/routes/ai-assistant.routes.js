import { z } from 'zod';
import {
  refineCandidateProfileHandler,
  reindexJobsHandler,
  searchJobsHandler,
} from '../controllers/ai-assistant.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requireAiFeature } from '../middlewares/entitlements.js';
import { validateBody } from '../middlewares/validate.js';

const refineCandidateProfileSchema = z.object({
  answers: z.record(z.string(), z.string().trim().max(2000)).refine(
    (value) => Object.values(value).some((entry) => entry.length > 0),
    { message: 'At least one answer is required' },
  ),
});

const searchJobsSchema = z.object({
  query: z.string().trim().min(2, 'Tell me what kind of job you are looking for').max(500),
});

export async function aiAssistantRoutes(app) {
  app.post('/candidate-profile/refine', {
    preHandler: [authenticate, requireAiFeature, validateBody(refineCandidateProfileSchema)],
  }, refineCandidateProfileHandler);

  // AI search is a plan feature — login + a plan with AI enabled required.
  app.post('/jobs/search', {
    preHandler: [authenticate, requireAiFeature, validateBody(searchJobsSchema)],
  }, searchJobsHandler);

  // Reindex hits the embeddings API — same AI-plan condition as every AI route
  // (admins bypass inside requireAiFeature).
  app.post('/jobs/reindex', {
    preHandler: [authenticate, requireAiFeature],
  }, reindexJobsHandler);
}
