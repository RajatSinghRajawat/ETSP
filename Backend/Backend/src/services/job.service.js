import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { AppError } from '../utils/app-error.js';
import { autoApplyNewJobInBackground } from './auto-apply.service.js';
import { assertCanPostJob, consumeJobCredit } from './entitlement.service.js';
import { notifyCandidatesOfJobInBackground } from './job-alert.service.js';
import { indexJobInBackground } from './job-rag.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
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

// Public listings only ever show live jobs: active AND not past validity.
const notExpiredFilter = () => ({ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });

function buildPublicJobFilters(query = {}) {
  const filters = { status: 'active', $and: [notExpiredFilter()] };

  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    filters.$and.push({
      $or: [
        { title: keyword },
        { companyName: keyword },
        { location: keyword },
        { skills: keyword },
      ],
    });
  }

  if (query.location) {
    filters.location = new RegExp(escapeRegex(String(query.location).trim()), 'i');
  }

  if (query.type) {
    filters.type = String(query.type).trim();
  }

  if (query.experience) {
    filters.experience = String(query.experience).trim();
  }

  if (query.skill) {
    filters.skills = new RegExp(escapeRegex(String(query.skill).trim()), 'i');
  }

  if (query.employerProfile && String(query.employerProfile).trim().match(/^[0-9a-fA-F]{24}$/)) {
    filters.employerProfile = String(query.employerProfile).trim();
  }

  return filters;
}

// Returns a Map of jobId(string) -> application status for the signed-in
// candidate, or null when the requester is not an authenticated candidate.
async function getCandidateApplicationMap(user) {
  if (!user || user.role !== 'candidate') {
    return null;
  }

  const candidate = await CandidateProfile.findOne({ email: user.email }).select('_id').lean();

  if (!candidate) {
    return new Map();
  }

  const applications = await JobApplication.find({ candidateProfile: candidate._id })
    .select('job status')
    .lean();

  return new Map(applications.map((application) => [String(application.job), application.status]));
}

async function getEmployerForJob(user) {
  if (user.role !== 'employer') {
    throw new AppError('Job posting requires employer account token', 403);
  }

  const employerProfile = await EmployerProfile.findOne({ email: user.email })
    .select('_id email companyName')
    .lean();

  if (!employerProfile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  return employerProfile;
}

export async function createJob(user, input) {
  const employerProfile = await getEmployerForJob(user);

  const { useJobCredit = false, ...jobInput } = input;

  const { jobSetup } = await assertCanPostJob(user, employerProfile._id, {
    useJobCredit,
    wantsFeatured: Boolean(jobInput.isFeatured),
    hasScreeningQuestions: (jobInput.screeningQuestions ?? []).length > 0,
  });

  const job = await Job.create({
    ...jobInput,
    employerProfile: employerProfile._id,
    employerEmail: employerProfile.email,
    companyName: employerProfile.companyName,
    postedVia: jobSetup.postedVia,
    jobCredit: jobSetup.jobCreditId,
    expiresAt: jobSetup.expiresAt,
    unlockCreditsTotal: jobSetup.unlockCreditsTotal,
    unlockCreditsUsed: 0,
  });

  if (jobSetup.jobCreditId) {
    await consumeJobCredit(jobSetup.jobCreditId, job._id);
  }

  if (job.status === 'active') {
    indexJobInBackground(job._id);
    autoApplyNewJobInBackground(job.toObject());
    notifyCandidatesOfJobInBackground(job.toObject());
  }

  return job.toObject();
}

export async function getMyJobs(user) {
  const employerProfile = await getEmployerForJob(user);

  return Job.find({ employerProfile: employerProfile._id })
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateJob(user, id, input) {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Job not found', 404);
  }

  const employerProfile = await getEmployerForJob(user);
  const job = await Job.findById(id);

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (String(job.employerProfile) !== String(employerProfile._id)) {
    throw new AppError('You can only edit your own job postings', 403);
  }

  const { useJobCredit = false, ...jobInput } = input;

  const wasLive =
    job.status === 'active' && (!job.expiresAt || new Date(job.expiresAt) > new Date());
  const wantsActive = (jobInput.status ?? job.status) === 'active';
  const reactivating = wantsActive && !wasLive;

  const addsFeatured = Boolean(jobInput.isFeatured) && !job.isFeatured;
  const addsScreening =
    (jobInput.screeningQuestions ?? []).length > 0 && (job.screeningQuestions ?? []).length === 0;

  // Re-gate whenever the edit brings the job (back) online or adds gated
  // features — plain edits to an already-live job stay ungated.
  if (reactivating || addsFeatured || addsScreening) {
    const wantsCredit = reactivating && (useJobCredit || job.postedVia === 'pay_per_job');

    const { jobSetup } = await assertCanPostJob(user, employerProfile._id, {
      useJobCredit: wantsCredit,
      wantsFeatured: Boolean(jobInput.isFeatured ?? job.isFeatured),
      hasScreeningQuestions:
        (jobInput.screeningQuestions ?? job.screeningQuestions ?? []).length > 0,
      excludeJobId: job._id,
    });

    if (reactivating) {
      job.postedVia = jobSetup.postedVia;
      job.expiresAt = jobSetup.expiresAt;

      if (jobSetup.jobCreditId) {
        job.jobCredit = jobSetup.jobCreditId;
        job.unlockCreditsTotal = job.unlockCreditsTotal + jobSetup.unlockCreditsTotal;
        await consumeJobCredit(jobSetup.jobCreditId, job._id);
      } else {
        job.unlockCreditsTotal = Math.max(job.unlockCreditsTotal, jobSetup.unlockCreditsTotal);
      }
    }
  }

  job.set({
    ...jobInput,
    employerProfile: job.employerProfile,
    employerEmail: job.employerEmail,
    companyName: job.companyName,
  });
  await job.save();

  if (job.status === 'active') {
    indexJobInBackground(job._id);
    autoApplyNewJobInBackground(job.toObject());
  }

  return job.toObject();
}

export async function getJobs(query, user) {
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = buildPublicJobFilters(query);

  // Resolve the candidate's applications so we can both filter by application
  // state and annotate each job with whether the candidate already applied.
  const applicationMap = await getCandidateApplicationMap(user);
  const appliedJobIds = applicationMap ? [...applicationMap.keys()] : [];

  const appliedFilter = String(query.applied || '').trim().toLowerCase();
  if (applicationMap && (appliedFilter === 'applied' || appliedFilter === 'unapplied')) {
    filters._id = appliedFilter === 'applied' ? { $in: appliedJobIds } : { $nin: appliedJobIds };
  }

  const [items, total] = await Promise.all([
    Job.find(filters)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filters),
  ]);

  const annotatedItems = items.map((job) => ({
    ...job,
    hasApplied: applicationMap ? applicationMap.has(String(job._id)) : false,
    applicationStatus: applicationMap ? applicationMap.get(String(job._id)) ?? null : null,
  }));

  return {
    items: annotatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function getJobById(id) {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Job not found', 404);
  }

  const job = await Job.findOne({ _id: id, status: 'active', ...notExpiredFilter() }).lean();

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return job;
}
