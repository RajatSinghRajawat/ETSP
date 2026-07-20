import {
  createProfile,
  getFeatured,
  getMyFollows,
  getMyProfile,
  getProfile,
  getProfiles,
  postUnlockProfile,
  postVerifyPhone,
  postVerifyPhoneConfirm,
  updateMyProfile,
  uploadProfileImage,
} from '../controllers/candidate-profile.controller.js';
import { z } from 'zod';
import { buildMyResume, fetchCandidateResume, fetchMyResume, refineMyResume, saveMyResume } from '../controllers/resume.controller.js';
import { authenticate } from '../middlewares/auth.js';
import {
  requireResumeBuilderAccess,
  requireResumeEditAccess,
} from '../middlewares/entitlements.js';
import { validateBody } from '../middlewares/validate.js';
import {
  candidateProfileSchema,
  candidateProfileUpdateSchema,
} from '../validations/candidate-profile.validation.js';

const resumeRefineSchema = z.object({
  mode: z.enum(['design', 'data', 'regenerate']).default('design'),
  instructions: z.string().trim().max(2000).default(''),
});

const unlockSchema = z.object({
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullish(),
});

const phoneOtpSchema = z.object({
  otp: z.string().trim().min(4).max(8),
});

export async function candidateProfileRoutes(app) {
  app.post('/image', uploadProfileImage);
  app.get('/featured', getFeatured);
  app.get('/me', { preHandler: authenticate }, getMyProfile);
  app.patch('/me', {
    preHandler: [authenticate, validateBody(candidateProfileUpdateSchema)],
  }, updateMyProfile);
  // The resume builder is included in EXCEL; free candidates pay ₹25 per
  // resume (credit checked on build, consumed after success). Viewing an
  // already-generated resume stays open.
  app.post('/me/resume', { preHandler: [authenticate, requireResumeBuilderAccess] }, buildMyResume);
  app.get('/me/resume', { preHandler: authenticate }, fetchMyResume);
  app.put('/me/resume', { preHandler: [authenticate, requireResumeEditAccess] }, saveMyResume);
  app.post('/me/resume/refine', {
    preHandler: [authenticate, requireResumeEditAccess, validateBody(resumeRefineSchema)],
  }, refineMyResume);
  // EXCEL: phone verification for the verified badge + followed employers.
  app.post('/me/verify-phone', { preHandler: authenticate }, postVerifyPhone);
  app.post('/me/verify-phone/confirm', {
    preHandler: [authenticate, validateBody(phoneOtpSchema)],
  }, postVerifyPhoneConfirm);
  app.get('/me/follows', { preHandler: authenticate }, getMyFollows);
  app.post('/', {
    preHandler: [authenticate, validateBody(candidateProfileSchema)],
  }, createProfile);
  app.get('/', { preHandler: authenticate }, getProfiles);
  // Candidate identity/contact is plan-gated — authentication required so the
  // employer's plan decides what is visible.
  app.get('/:id', { preHandler: authenticate }, getProfile);
  app.post('/:id/unlock', {
    preHandler: [authenticate, validateBody(unlockSchema)],
  }, postUnlockProfile);
  app.get('/:id/resume', { preHandler: authenticate }, fetchCandidateResume);
}
