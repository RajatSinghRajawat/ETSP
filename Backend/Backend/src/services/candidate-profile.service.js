import { CandidateProfile } from '../models/candidate-profile.model.js';
import { AppError } from '../utils/app-error.js';
import {
  canEmployerViewCandidate,
  getUnlockedCandidateIds,
  isExcelActive,
  maskCandidate,
} from './candidate-masking.service.js';
import { getEmployerContext, getEntitlements } from './entitlement.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function buildCandidateFilters(query = {}) {
  const filters = { status: 'submitted' };
  const andFilters = [];

  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    andFilters.push({
      $or: [
        { firstName: keyword },
        { lastName: keyword },
        { currentJobTitle: keyword },
        { organizationName: keyword },
        { degree: keyword },
        { skills: keyword },
      ],
    });
  }

  if (query.location) {
    const location = new RegExp(escapeRegex(String(query.location).trim()), 'i');
    andFilters.push({
      $or: [
        { currentLocation: location },
        { preferredLocations: location },
      ],
    });
  }

  if (query.experience) {
    const experience = new RegExp(escapeRegex(String(query.experience).trim()), 'i');
    andFilters.push({
      $or: [
        { currentJobTitle: experience },
        { 'experiences.jobTitle': experience },
        { 'experiences.employmentType': experience },
      ],
    });
  }

  if (query.salary) {
    filters.currentSalary = new RegExp(escapeRegex(String(query.salary).trim()), 'i');
  }

  if (query.skill) {
    filters.skills = new RegExp(escapeRegex(String(query.skill).trim()), 'i');
  }

  if (andFilters.length > 0) {
    filters.$and = andFilters;
  }

  return filters;
}

function getDuplicateCandidateMessage(error) {
  if (error?.code !== 11000) {
    return null;
  }

  if (error.keyPattern?.email || error.keyValue?.email) {
    return 'Candidate profile already exists with this email';
  }

  if (error.keyPattern?.phone || error.keyValue?.phone) {
    return 'Candidate profile already exists with this phone number';
  }

  return 'Candidate profile already exists';
}

/** Computed badges shown across employer-facing surfaces. */
function withBadges(candidate) {
  const excelMember = isExcelActive(candidate);

  return {
    ...candidate,
    excelMember,
    verifiedBadge: Boolean(
      excelMember && candidate.emailVerified && candidate.phoneVerified,
    ),
  };
}

export async function createCandidateProfile(input) {
  const [profileForEmail, profileForPhone] = await Promise.all([
    CandidateProfile.findOne({ email: input.email }).select('_id').lean(),
    CandidateProfile.findOne({ phone: input.phone }).select('_id').lean(),
  ]);

  if (profileForEmail) {
    throw new AppError(
      'You already have a candidate profile. Please update it instead of creating a new one.',
      409,
    );
  }

  if (profileForPhone) {
    throw new AppError('This phone number is already linked to another candidate profile', 409);
  }

  try {
    const profile = await CandidateProfile.create(input);
    return profile.toObject();
  } catch (error) {
    const duplicateMessage = getDuplicateCandidateMessage(error);
    if (duplicateMessage) {
      throw new AppError(duplicateMessage, 409);
    }

    throw error;
  }
}

/**
 * Employer/admin candidate directory. For employers this enforces:
 *  - plan gate on screening filters (location / experience / salary),
 *  - hidden profiles excluded (EXCEL members may opt out of search),
 *  - EXCEL search boost ordering,
 *  - masking of locked profiles (name/contact hidden until unlocked).
 */
export async function getCandidateProfiles(query = {}, user = null) {
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const isEmployer = user?.role === 'employer';
  let employerContext = null;

  if (isEmployer) {
    employerContext = await getEmployerContext(user);

    const usesGatedFilters = Boolean(query.location || query.experience || query.salary);

    if (usesGatedFilters && !employerContext.effectiveFeatures.searchFiltersEnabled) {
      throw new AppError(
        'Candidate screening filters (location, experience, salary) are not included in your current plan. Upgrade to use them.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }
  }

  const filters = buildCandidateFilters(query);

  if (isEmployer) {
    // EXCEL members may hide their profile from search; free profiles are
    // always open to recruiters.
    filters.profileVisible = { $ne: false };
  }

  const [items, total] = await Promise.all([
    CandidateProfile.find(filters)
      .sort({ searchBoost: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CandidateProfile.countDocuments(filters),
  ]);

  let resultItems = items.map(withBadges);

  if (isEmployer && employerContext?.employerProfile) {
    const unlockedSet = await getUnlockedCandidateIds(
      employerContext.employerProfile._id,
      items.map((item) => item._id),
    );

    resultItems = resultItems.map((candidate) =>
      canEmployerViewCandidate({
        effectiveFeatures: employerContext.effectiveFeatures,
        candidate,
        unlockedSet,
      })
        ? candidate
        : withBadges(maskCandidate(candidate)),
    );
  }

  return {
    items: resultItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

/**
 * Single candidate profile. Admins see everything; candidates only their own
 * profile; employers get the masked view until the profile is unlocked (or
 * the candidate is an EXCEL member visible to their plan).
 */
export async function getCandidateProfile(id, user = null) {
  const profile = await CandidateProfile.findById(id).lean();

  if (!profile) {
    throw new AppError('Candidate profile not found', 404);
  }

  if (user?.role === 'admin') {
    return withBadges(profile);
  }

  if (user?.role === 'candidate') {
    if (profile.email !== user.email) {
      throw new AppError('You can only view your own candidate profile', 403);
    }

    return withBadges(profile);
  }

  if (user?.role === 'employer') {
    const employerContext = await getEmployerContext(user);

    if (!employerContext.employerProfile) {
      throw new AppError('Employer profile not found for this account', 404);
    }

    const unlockedSet = await getUnlockedCandidateIds(employerContext.employerProfile._id, [
      profile._id,
    ]);

    if (
      canEmployerViewCandidate({
        effectiveFeatures: employerContext.effectiveFeatures,
        candidate: profile,
        unlockedSet,
      })
    ) {
      return withBadges(profile);
    }

    return withBadges(maskCandidate(profile));
  }

  throw new AppError('Authentication required', 401);
}

export async function getFeaturedCandidateProfiles(query = {}) {
  const limit = Math.min(toPositiveNumber(query.limit, 8), 12);
  const filters = { status: 'submitted', profileVisible: { $ne: false } };
  const projection = {
    firstName: 1,
    lastName: 1,
    currentJobTitle: 1,
    organizationName: 1,
    currentLocation: 1,
    skills: 1,
    photoUrl: 1,
    aadhaarVerified: 1,
    educationLevel: 1,
    degree: 1,
    createdAt: 1,
    subscriptionTier: 1,
    subscriptionExpiresAt: 1,
    emailVerified: 1,
    phoneVerified: 1,
    searchBoost: 1,
  };

  const [items, total] = await Promise.all([
    CandidateProfile.find(filters, projection)
      .sort({ searchBoost: -1, createdAt: -1 })
      .limit(limit)
      .lean(),
    CandidateProfile.countDocuments(filters),
  ]);

  return {
    items: items.map((item) => {
      const excelMember = isExcelActive(item);

      return {
        _id: item._id,
        firstName: item.firstName,
        lastNameInitial: item.lastName ? `${item.lastName.charAt(0)}.` : '',
        currentJobTitle: item.currentJobTitle,
        organizationName: item.organizationName,
        currentLocation: item.currentLocation,
        skills: Array.isArray(item.skills) ? item.skills.slice(0, 4) : [],
        photoUrl: item.photoUrl || '',
        aadhaarVerified: Boolean(item.aadhaarVerified),
        educationLevel: item.educationLevel,
        degree: item.degree,
        excelMember,
        verifiedBadge: Boolean(excelMember && item.emailVerified && item.phoneVerified),
        featuredProfile: excelMember,
      };
    }),
    total,
  };
}

export async function getCandidateProfileByEmail(email) {
  const profile = await CandidateProfile.findOne({ email }).lean();

  if (!profile) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return withBadges(profile);
}

export async function updateCandidateProfileByEmail(email, input) {
  const profile = await CandidateProfile.findOneAndUpdate(
    { email },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();

  if (!profile) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return withBadges(profile);
}

/**
 * Candidate self-update with plan gating on the EXCEL-only toggles:
 * hiding the profile from recruiters and enabling job-alert emails.
 */
export async function updateMyCandidateProfile(user, input) {
  const gatedInput = { ...input };

  if (gatedInput.profileVisible === false || gatedInput.jobAlertsEnabled === true) {
    const entitlements = await getEntitlements(user);

    if (gatedInput.profileVisible === false && !entitlements.features.visibilityToggleEnabled) {
      throw new AppError(
        'Hiding your profile from recruiters is available on the EXCEL plan.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }

    if (gatedInput.jobAlertsEnabled === true && !entitlements.features.jobAlertsEnabled) {
      throw new AppError(
        'Job alert emails are available on the EXCEL plan. Upgrade to enable them.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }
  }

  return updateCandidateProfileByEmail(user.email, gatedInput);
}
