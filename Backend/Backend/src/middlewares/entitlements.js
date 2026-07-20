import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Resume } from '../models/resume.model.js';
import { assertAiEnabled, getEntitlements } from '../services/entitlement.service.js';
import { AppError } from '../utils/app-error.js';

// Route-level gate for AI endpoints. Admins bypass plan checks — plans apply
// to employer/candidate accounts only.
export async function requireAiFeature(request) {
  if (request.user?.role === 'admin') {
    return;
  }

  await assertAiEnabled(request.user);
}

/**
 * Gate for BUILDING a resume: included in the plan (EXCEL), or the candidate
 * holds a paid ₹25 resume credit. The credit is consumed after a successful
 * build (see resume controller) — this only verifies access.
 */
export async function requireResumeBuilderAccess(request) {
  if (request.user?.role === 'admin') {
    return;
  }

  const entitlements = await getEntitlements(request.user);

  if (entitlements.features.resumeBuilderIncluded) {
    request.resumeBuilderIncluded = true;
    return;
  }

  const candidate = await CandidateProfile.findOne({ email: request.user.email })
    .select('resumeCreditBalance')
    .lean();

  if ((candidate?.resumeCreditBalance ?? 0) > 0) {
    request.resumeBuilderIncluded = false;
    return;
  }

  throw new AppError(
    'The resume builder costs ₹25 per resume on your current plan. Buy a resume credit or upgrade to EXCEL.',
    402,
    { canBuy: true },
    'NO_RESUME_CREDITS',
  );
}

/**
 * Gate for EDITING (save/refine) an existing resume: included in the plan, or
 * a previously built resume exists (paid for with a credit).
 */
export async function requireResumeEditAccess(request) {
  if (request.user?.role === 'admin') {
    return;
  }

  const entitlements = await getEntitlements(request.user);

  if (entitlements.features.resumeBuilderIncluded) {
    return;
  }

  const candidate = await CandidateProfile.findOne({ email: request.user.email })
    .select('_id')
    .lean();

  const existing = candidate
    ? await Resume.findOne({ candidateId: candidate._id }).select('_id').lean()
    : null;

  if (existing) {
    return;
  }

  throw new AppError(
    'Build a resume first — the resume builder costs ₹25 per resume on your current plan.',
    402,
    { canBuy: true },
    'NO_RESUME_CREDITS',
  );
}
