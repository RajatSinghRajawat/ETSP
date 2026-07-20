import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerFollow } from '../models/employer-follow.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { AppError } from '../utils/app-error.js';
import { getEntitlements } from './entitlement.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

async function getCandidateForUser(user) {
  if (user.role !== 'candidate') {
    throw new AppError('Following employers requires a candidate account', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email })
    .select('_id email')
    .lean();

  if (!candidate) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return candidate;
}

/** EXCEL feature: follow an employer to get emailed about their new jobs. */
export async function followEmployer(user, employerProfileId) {
  if (!isObjectId(employerProfileId)) {
    throw new AppError('Employer not found', 404);
  }

  const entitlements = await getEntitlements(user);

  if (!entitlements.features.followEmployersEnabled) {
    throw new AppError(
      'Following employers is available on the EXCEL plan. Upgrade to follow employers.',
      403,
      undefined,
      'FEATURE_NOT_IN_PLAN',
    );
  }

  const [candidate, employer] = await Promise.all([
    getCandidateForUser(user),
    EmployerProfile.findById(employerProfileId).select('_id companyName').lean(),
  ]);

  if (!employer) {
    throw new AppError('Employer not found', 404);
  }

  try {
    await EmployerFollow.create({
      candidateProfile: candidate._id,
      candidateEmail: candidate.email,
      employerProfile: employer._id,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }

  return { following: true, employerProfile: String(employer._id) };
}

export async function unfollowEmployer(user, employerProfileId) {
  const candidate = await getCandidateForUser(user);

  await EmployerFollow.deleteOne({
    candidateProfile: candidate._id,
    employerProfile: employerProfileId,
  });

  return { following: false, employerProfile: String(employerProfileId) };
}

export async function listMyFollows(user) {
  const candidate = await getCandidateForUser(user);

  const follows = await EmployerFollow.find({ candidateProfile: candidate._id })
    .populate('employerProfile', 'companyName logoUrl headquarters organizationType')
    .sort({ createdAt: -1 })
    .lean();

  return {
    items: follows
      .filter((follow) => follow.employerProfile)
      .map((follow) => ({
        _id: String(follow._id),
        employerProfile: follow.employerProfile,
        followedAt: follow.createdAt,
      })),
  };
}
