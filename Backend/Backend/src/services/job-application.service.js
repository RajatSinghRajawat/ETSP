import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { Job } from '../models/job.model.js';
import { AppError } from '../utils/app-error.js';
import { sendEmployerApplicationAck } from './auto-reply.service.js';
import { maskApplicationsForEmployer } from './candidate-masking.service.js';
import { assertCanApply, getEmployerContext } from './entitlement.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

async function getCandidateProfileForUser(user) {
  if (user.role !== 'candidate') {
    throw new AppError('Candidate account required', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email })
    .select('_id email')
    .lean();

  if (!candidate) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return candidate;
}

async function getEmployerProfileForUser(user) {
  if (user.role !== 'employer') {
    throw new AppError('Applications access requires employer account token', 403);
  }

  const employerProfile = await EmployerProfile.findOne({ email: user.email }).select('_id').lean();

  if (!employerProfile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  return employerProfile;
}

export async function createJobApplication(user, input) {
  if (user.role !== 'candidate') {
    throw new AppError('Job application requires candidate account token', 403);
  }

  const [candidateProfile, job] = await Promise.all([
    CandidateProfile.findOne({ email: user.email }).select('_id email').lean(),
    Job.findOne({
      _id: input.jobId,
      status: 'active',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select('_id title employerProfile employerEmail screeningQuestions')
      .lean(),
  ]);

  if (!candidateProfile) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  if (!job) {
    throw new AppError('Job not found or closed', 404);
  }

  await assertCanApply(user, candidateProfile._id);

  // Screening answers must line up with the job's questions (paid feature).
  const questions = (job.screeningQuestions ?? []).map((entry) => entry.question);
  let screeningAnswers = [];

  if (questions.length > 0) {
    const answers = input.screeningAnswers ?? [];
    const answerMap = new Map(answers.map((entry) => [entry.question, entry.answer]));

    screeningAnswers = questions.map((question) => ({
      question,
      answer: String(answerMap.get(question) ?? '').trim(),
    }));

    if (screeningAnswers.some((entry) => !entry.answer)) {
      throw new AppError('Please answer all screening questions for this job', 400);
    }
  }

  try {
    const application = await JobApplication.create({
      job: job._id,
      employerProfile: job.employerProfile,
      candidateProfile: candidateProfile._id,
      candidateEmail: candidateProfile.email,
      coverLetter: input.coverLetter,
      screeningAnswers,
    });

    sendEmployerApplicationAck({ job, candidateProfileId: candidateProfile._id });

    return application.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('You have already applied to this job', 409);
    }

    throw error;
  }
}

export async function getEmployerApplications(user, query = {}) {
  const employerProfile = await getEmployerProfileForUser(user);
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = { employerProfile: employerProfile._id };

  if (query.status) {
    filters.status = String(query.status).trim();
  }

  if (query.job) {
    filters.job = String(query.job).trim();
  }

  const [items, total] = await Promise.all([
    JobApplication.find(filters)
      .populate('job', 'title location type salary status')
      .populate(
        'candidateProfile',
        'firstName lastName email phone currentJobTitle currentLocation skills photoUrl degree subscriptionTier subscriptionExpiresAt emailVerified phoneVerified',
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    JobApplication.countDocuments(filters),
  ]);

  // Plan-driven masking: lock name/contact of applicants the employer has not
  // unlocked (EXCEL members are visible per the plan's rules).
  const { effectiveFeatures } = await getEmployerContext(user);
  const maskedItems = await maskApplicationsForEmployer({
    effectiveFeatures,
    employerProfileId: employerProfile._id,
    applications: items,
  });

  return {
    items: maskedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function getEmployerApplication(user, id) {
  const employerProfile = await getEmployerProfileForUser(user);
  const application = await JobApplication.findOne({ _id: id, employerProfile: employerProfile._id })
    .populate('job', 'title location type salary description skills experience education benefits status')
    .populate('candidateProfile')
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const { effectiveFeatures } = await getEmployerContext(user);
  const [masked] = await maskApplicationsForEmployer({
    effectiveFeatures,
    employerProfileId: employerProfile._id,
    applications: [application],
  });

  return masked;
}

export async function getMyCandidateApplications(user, query = {}) {
  const candidate = await getCandidateProfileForUser(user);

  const filters = { candidateProfile: candidate._id };

  if (query.jobId && /^[0-9a-fA-F]{24}$/.test(String(query.jobId))) {
    filters.job = String(query.jobId);
  }

  if (query.status) {
    filters.status = String(query.status).trim();
  }

  return JobApplication.find(filters)
    .select('job status coverLetter createdAt updatedAt')
    .populate('job', 'title companyName location type salary status')
    .sort({ createdAt: -1 })
    .lean();
}

const APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

export async function updateEmployerApplicationStatus(user, id, status) {
  const employerProfile = await getEmployerProfileForUser(user);

  if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
    throw new AppError('Invalid application id', 400);
  }

  if (!APPLICATION_STATUSES.includes(status)) {
    throw new AppError('Invalid application status', 400);
  }

  const application = await JobApplication.findOneAndUpdate(
    { _id: id, employerProfile: employerProfile._id },
    { $set: { status } },
    { new: true, runValidators: true },
  )
    .populate('job', 'title location type salary description skills experience education benefits status')
    .populate('candidateProfile')
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const { effectiveFeatures } = await getEmployerContext(user);
  const [masked] = await maskApplicationsForEmployer({
    effectiveFeatures,
    employerProfileId: employerProfile._id,
    applications: [application],
  });

  return masked;
}

export async function getMyApplicationForJob(user, jobId) {
  if (!/^[0-9a-fA-F]{24}$/.test(String(jobId))) {
    throw new AppError('Invalid job id', 400);
  }

  const candidate = await getCandidateProfileForUser(user);
  const application = await JobApplication.findOne({
    candidateProfile: candidate._id,
    job: jobId,
  })
    .select('job status coverLetter createdAt updatedAt')
    .lean();

  return application; // may be null — controller decides response shape
}
