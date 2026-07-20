import { CandidateProfile } from '../models/candidate-profile.model.js';
import {
  canEmployerViewCandidate,
  getUnlockedCandidateIds,
} from '../services/candidate-masking.service.js';
import { getEmployerContext } from '../services/entitlement.service.js';
import * as resumeService from '../services/resume.service.js';
import { AppError } from '../utils/app-error.js';

function ok(message, data) {
  return { success: true, message, data };
}

// Admin routes — by candidateId
export async function buildResume(request) {
  const data = await resumeService.generateResume(request.params.id);
  return ok('Resume generated successfully', data);
}

export async function fetchResume(request) {
  const data = await resumeService.getResume(request.params.id);
  return ok('Resume fetched successfully', data);
}

export async function saveResume(request) {
  const { htmlContent } = request.body;
  const data = await resumeService.updateResume(request.params.id, htmlContent);
  return ok('Resume saved successfully', data);
}

// Candidate-facing routes — by logged-in user's email
export async function buildMyResume(request) {
  if (request.user.role !== 'candidate') throw new AppError('Candidate account required', 403);
  const data = await resumeService.generateResumeByEmail(request.user.email);

  // Free-plan candidates pay ₹25 per resume — consume the credit only after
  // a successful build (requireResumeBuilderAccess verified it exists).
  if (request.resumeBuilderIncluded === false) {
    await CandidateProfile.updateOne(
      { email: request.user.email, resumeCreditBalance: { $gt: 0 } },
      { $inc: { resumeCreditBalance: -1 } },
    );
  }

  return ok('Resume generated successfully', data);
}

export async function fetchMyResume(request) {
  if (request.user.role !== 'candidate') throw new AppError('Candidate account required', 403);
  const data = await resumeService.getResumeByEmail(request.user.email);
  return ok('Resume fetched successfully', data);
}

export async function saveMyResume(request) {
  if (request.user.role !== 'candidate') throw new AppError('Candidate account required', 403);
  const { htmlContent } = request.body;
  const data = await resumeService.updateResumeByEmail(request.user.email, htmlContent);
  return ok('Resume saved successfully', data);
}

export async function refineMyResume(request) {
  if (request.user.role !== 'candidate') throw new AppError('Candidate account required', 403);
  const { mode = 'design', instructions = '' } = request.body ?? {};
  const data = await resumeService.refineResumeByEmail(request.user.email, { mode, instructions });
  return ok('Resume refined successfully', data);
}

// Employer/admin route: fetch a candidate's resume by their profile id.
// Auto-generates the resume on first access so employers don't see "not found".
export async function fetchCandidateResume(request) {
  const role = request.user?.role;
  if (role !== 'employer' && role !== 'admin') {
    throw new AppError('Only employers or admins can fetch a candidate resume', 403);
  }

  // The resume contains the candidate's full identity — employers must be
  // entitled to see this profile (unlocked, or EXCEL visible to their plan).
  if (role === 'employer') {
    const candidate = await CandidateProfile.findById(request.params.id)
      .select('_id subscriptionTier subscriptionExpiresAt')
      .lean();

    if (!candidate) {
      throw new AppError('Candidate not found', 404);
    }

    const { employerProfile, effectiveFeatures } = await getEmployerContext(request.user);

    if (!employerProfile) {
      throw new AppError('Employer profile not found for this account', 404);
    }

    const unlockedSet = await getUnlockedCandidateIds(employerProfile._id, [candidate._id]);

    if (!canEmployerViewCandidate({ effectiveFeatures, candidate, unlockedSet })) {
      throw new AppError(
        'Unlock this profile to view the candidate resume.',
        403,
        undefined,
        'PROFILE_LOCKED',
      );
    }
  }

  const data = await resumeService.getOrBuildResume(request.params.id);
  return ok('Resume fetched successfully', data);
}
