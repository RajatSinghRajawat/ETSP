import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { markImportedEmployerRegistered } from './imported-employer.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/app-error.js';

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

function getDuplicateEmployerMessage(error) {
  if (error?.code !== 11000) {
    return null;
  }

  if (error.keyPattern?.email || error.keyValue?.email) {
    return 'Employer profile already exists with this email';
  }

  if (error.keyPattern?.phoneNumber || error.keyValue?.phoneNumber) {
    return 'Employer profile already exists with this phone number';
  }

  return 'Employer profile already exists';
}

function buildEmployerFilters(query = {}) {
  const filters = { status: 'submitted' };
  const andFilters = [];

  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    andFilters.push({
      $or: [
        { companyName: keyword },
        { headquarters: keyword },
        { organizationType: keyword },
        { specialties: keyword },
        { hiringRegions: keyword },
      ],
    });
  }

  if (query.location) {
    const location = new RegExp(escapeRegex(String(query.location).trim()), 'i');
    andFilters.push({
      $or: [
        { headquarters: location },
        { hiringRegions: location },
      ],
    });
  }

  if (query.type) {
    filters.organizationType = new RegExp(escapeRegex(String(query.type).trim()), 'i');
  }

  if (query.size) {
    filters.teamSize = new RegExp(escapeRegex(String(query.size).trim()), 'i');
  }

  if (andFilters.length > 0) {
    filters.$and = andFilters;
  }

  return filters;
}

async function attachOpenJobs(profiles) {
  if (profiles.length === 0) {
    return profiles;
  }

  const profileIds = profiles.map((profile) => profile._id);
  const jobCounts = await Job.aggregate([
    { $match: { employerProfile: { $in: profileIds }, status: 'active' } },
    { $group: { _id: '$employerProfile', total: { $sum: 1 } } },
  ]);
  const countsByProfile = new Map(jobCounts.map((item) => [String(item._id), item.total]));

  return profiles.map((profile) => ({
    ...profile,
    openJobs: countsByProfile.get(String(profile._id)) ?? 0,
  }));
}

export async function createEmployerProfile(input) {
  const existingProfile = await EmployerProfile.findOne({
    $or: [{ email: input.email }, { phoneNumber: input.phoneNumber }],
  })
    .select('email phoneNumber')
    .lean();

  if (existingProfile?.email === input.email) {
    throw new AppError('Employer profile already exists with this email', 409);
  }

  if (existingProfile?.phoneNumber === input.phoneNumber) {
    throw new AppError('Employer profile already exists with this phone number', 409);
  }

  try {
    const profile = await EmployerProfile.create(input);

    try {
      await markImportedEmployerRegistered({
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        profileId: profile._id,
      });
    } catch (error) {
      logger.warn(`Failed to mark imported employer as registered: ${error.message}`);
    }

    return profile.toObject();
  } catch (error) {
    const duplicateMessage = getDuplicateEmployerMessage(error);
    if (duplicateMessage) {
      throw new AppError(duplicateMessage, 409);
    }

    throw error;
  }
}

export async function getEmployerProfiles(query = {}) {
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = buildEmployerFilters(query);

  const [profiles, total] = await Promise.all([
    EmployerProfile.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EmployerProfile.countDocuments(filters),
  ]);

  return {
    items: await attachOpenJobs(profiles),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function getEmployerProfile(id) {
  const profile = await EmployerProfile.findById(id).lean();

  if (!profile) {
    throw new AppError('Employer profile not found', 404);
  }

  const [profileWithJobs] = await attachOpenJobs([profile]);

  return profileWithJobs;
}

export async function getEmployerProfileByEmail(email) {
  const profile = await EmployerProfile.findOne({ email }).lean();

  if (!profile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  return profile;
}

export async function updateEmployerProfileByEmail(email, input) {
  const profile = await EmployerProfile.findOneAndUpdate(
    { email },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();

  if (!profile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  return profile;
}
