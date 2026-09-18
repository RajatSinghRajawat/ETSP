import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { Job } from '../models/job.model.js';
import { AppError } from '../utils/app-error.js';
import { sendEmployerApplicationAck } from './auto-reply.service.js';
import { maskApplicationsForEmployer } from './candidate-masking.service.js';
import { assertCanApply, getEmployerContext } from './entitlement.service.js';
import { notify } from './notification.service.js';

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

  const employerProfile = await EmployerProfile.findOne({ email: user.email })
    .select('_id email companyName')
    .lean();

  if (!employerProfile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  return employerProfile;
}

const STATUS_LABELS = {
  new: 'Applied',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
  hired: 'Hired',
};

const NOTIFICATION_TYPE_BY_STATUS = {
  new: 'application_submitted',
  reviewing: 'application_reviewing',
  shortlisted: 'application_shortlisted',
  rejected: 'application_rejected',
  hired: 'application_hired',
};

function formatInterviewDate(value) {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

/** The candidate-facing headline for a status move. */
function buildStatusNotification({ status, jobTitle, companyName, message, interviewAt }) {
  const at = companyName ? ` at ${companyName}` : '';
  const role = jobTitle ? ` for "${jobTitle}"${at}` : '';
  const parts = [];

  if (status === 'rejected') {
    parts.push(`Your application${role} was not taken forward.`);
  } else if (status === 'shortlisted') {
    parts.push(`You have been shortlisted${role}.`);
  } else if (status === 'hired') {
    parts.push(`Congratulations! You have been hired${role}.`);
  } else if (status === 'reviewing') {
    parts.push(`Your application${role} is under review.`);
  } else {
    parts.push(`Your application${role} was updated.`);
  }

  const interviewText = formatInterviewDate(interviewAt);
  if (interviewText) {
    parts.push(`Interview scheduled for ${interviewText}.`);
  }

  if (message) {
    parts.push(`Employer's message: ${message}`);
  }

  return {
    title:
      status === 'rejected'
        ? 'Application rejected'
        : status === 'shortlisted'
          ? 'You have been shortlisted'
          : status === 'hired'
            ? 'You have been hired'
            : `Application ${STATUS_LABELS[status] ?? status}`,
    message: parts.join(' '),
  };
}

/**
 * Stamp `viewedByEmployer` on applications the employer has just read, and tell
 * each candidate once. Mutates the passed rows so the response reflects it.
 */
async function markApplicationsViewed(applications, employerProfile) {
  const unseen = applications.filter((application) => !application.viewedByEmployer);

  if (unseen.length === 0) {
    return;
  }

  const viewedAt = new Date();

  await JobApplication.updateMany(
    { _id: { $in: unseen.map((application) => application._id) } },
    { $set: { viewedByEmployer: true, viewedAt } },
  );

  for (const application of unseen) {
    application.viewedByEmployer = true;
    application.viewedAt = viewedAt;

    notify({
      recipientEmail: application.candidateEmail,
      recipientRole: 'candidate',
      type: 'application_viewed',
      title: 'Your application was viewed',
      message: `${employerProfile.companyName || 'The employer'} viewed your application for "${application.job?.title ?? 'a job'}".`,
      link: '/candidate/dashboard',
      meta: {
        applicationId: String(application._id),
        jobId: application.job?._id ? String(application.job._id) : null,
        jobTitle: application.job?.title ?? '',
        companyName: employerProfile.companyName ?? '',
      },
    });
  }
}

export async function createJobApplication(user, input) {
  if (user.role !== 'candidate') {
    throw new AppError('Job application requires candidate account token', 403);
  }

  const [candidateProfile, job] = await Promise.all([
    CandidateProfile.findOne({ email: user.email })
      .select('_id email approvalStatus firstName lastName')
      .lean(),
    Job.findOne({
      _id: input.jobId,
      status: 'active',
      approvalStatus: 'approved',
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select('_id title employerProfile employerEmail screeningQuestions')
      .lean(),
  ]);

  if (!candidateProfile) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  if (candidateProfile.approvalStatus !== 'approved') {
    throw new AppError(
      'Your profile approval is pending. You can apply for jobs after admin approval.',
      403,
      undefined,
      'PROFILE_APPROVAL_PENDING',
    );
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
      statusHistory: [{ status: 'new', message: '', interviewAt: null, changedAt: new Date() }],
    });

    sendEmployerApplicationAck({ job, candidateProfileId: candidateProfile._id });

    const candidateName =
      [candidateProfile.firstName, candidateProfile.lastName].filter(Boolean).join(' ').trim() ||
      'A candidate';

    notify({
      recipientEmail: job.employerEmail,
      recipientRole: 'employer',
      type: 'application_submitted',
      title: 'New job application',
      message: `${candidateName} applied for "${job.title}".`,
      link: `/employer/applications/${application._id}`,
      meta: {
        applicationId: String(application._id),
        jobId: String(job._id),
        jobTitle: job.title,
        candidateName,
      },
    });

    return application.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError('You have already applied to this job', 409);
    }

    throw error;
  }
}

const APPLICATION_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  status: { status: 1, createdAt: -1 },
};

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

  if (query.interest) {
    const interest = String(query.interest).trim();
    filters.employerInterest = interest === 'unmarked' ? { $in: ['', null] } : interest;
  }

  // Candidate-side filters (name / location / search) have to be resolved
  // against CandidateProfile first, since they are not on the application.
  const candidateFilters = {};

  if (query.location) {
    candidateFilters.currentLocation = new RegExp(escapeRegex(String(query.location).trim()), 'i');
  }

  if (query.search) {
    const keyword = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    candidateFilters.$or = [
      { firstName: keyword },
      { lastName: keyword },
      { currentJobTitle: keyword },
      { currentLocation: keyword },
      { skills: keyword },
    ];
  }

  if (Object.keys(candidateFilters).length > 0) {
    const matches = await CandidateProfile.find(candidateFilters).select('_id').lean();
    filters.candidateProfile = { $in: matches.map((row) => row._id) };
  }

  const sort = APPLICATION_SORTS[String(query.sort ?? '').trim()] ?? APPLICATION_SORTS.newest;

  const [items, total] = await Promise.all([
    JobApplication.find(filters)
      .populate('job', 'title location type salary status')
      .populate(
        'candidateProfile',
        'firstName lastName email phone currentJobTitle currentLocation skills photoUrl degree educationLevel subscriptionTier subscriptionExpiresAt emailVerified phoneVerified',
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    JobApplication.countDocuments(filters),
  ]);

  // Opening a single job's applicant list is the employer reading those
  // applications, so stamp them the same way the detail page does. Only done
  // for a job-scoped request — the unfiltered list is a dashboard overview.
  if (query.job) {
    await markApplicationsViewed(items, employerProfile);
  }

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

/**
 * Application counts per job for the signed-in employer's dashboard, so the job
 * list can show "12 applicants · 3 shortlisted" without fetching the rows.
 */
export async function getEmployerApplicationCounts(user) {
  const employerProfile = await getEmployerProfileForUser(user);

  const rows = await JobApplication.aggregate([
    { $match: { employerProfile: employerProfile._id } },
    { $group: { _id: { job: '$job', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const byJob = {};
  let total = 0;

  for (const row of rows) {
    const jobId = String(row._id.job);
    const status = row._id.status;

    byJob[jobId] ??= { total: 0, new: 0, reviewing: 0, shortlisted: 0, rejected: 0, hired: 0 };
    byJob[jobId][status] = (byJob[jobId][status] ?? 0) + row.count;
    byJob[jobId].total += row.count;
    total += row.count;
  }

  return { byJob, total };
}

const EMPLOYER_INTERESTS = ['', 'interested', 'undecided', 'not_interested'];

/**
 * The employer's private ✓ / ? / ✗ triage mark on an applicant. Intentionally
 * does NOT touch `status` or notify the candidate — moving someone through the
 * pipeline is `updateEmployerApplicationStatus`.
 */
export async function setEmployerApplicationInterest(user, id, input = {}) {
  const employerProfile = await getEmployerProfileForUser(user);
  const interest = String(input.interest ?? '');

  if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
    throw new AppError('Invalid application id', 400);
  }

  if (!EMPLOYER_INTERESTS.includes(interest)) {
    throw new AppError('Invalid interest value', 400);
  }

  const application = await JobApplication.findOneAndUpdate(
    { _id: id, employerProfile: employerProfile._id },
    { $set: { employerInterest: interest, viewedByEmployer: true } },
    { new: true, runValidators: true },
  )
    .populate('job', 'title location type salary status')
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

export async function getEmployerApplication(user, id) {
  const employerProfile = await getEmployerProfileForUser(user);

  if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
    throw new AppError('Invalid application id', 400);
  }

  const application = await JobApplication.findOne({ _id: id, employerProfile: employerProfile._id })
    .populate('job', 'title companyName location type salary description skills experience education benefits status')
    .populate('candidateProfile')
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Opening the detail page is what counts as "the employer looked at it".
  await markApplicationsViewed([application], employerProfile);

  const { effectiveFeatures } = await getEmployerContext(user);
  const [masked] = await maskApplicationsForEmployer({
    effectiveFeatures,
    employerProfileId: employerProfile._id,
    applications: [application],
  });

  return masked;
}

const CANDIDATE_APPLICATION_FIELDS =
  'job status coverLetter viewedByEmployer viewedAt employerMessage interview statusHistory createdAt updatedAt';

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
    .select(CANDIDATE_APPLICATION_FIELDS)
    .populate('job', 'title companyName location type salary status')
    .sort({ createdAt: -1 })
    .lean();
}

const APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'];

/**
 * Move an application through the hiring pipeline.
 *
 * The employer's decision carries a message (mandatory on a rejection) and,
 * when they accept, an interview slot. Every move is appended to
 * `statusHistory` and pushed to the candidate as a notification.
 */
export async function updateEmployerApplicationStatus(user, id, input = {}) {
  const employerProfile = await getEmployerProfileForUser(user);
  const { status } = input;

  if (!/^[0-9a-fA-F]{24}$/.test(String(id))) {
    throw new AppError('Invalid application id', 400);
  }

  if (!APPLICATION_STATUSES.includes(status)) {
    throw new AppError('Invalid application status', 400);
  }

  const message = String(input.message ?? '').trim();

  if (status === 'rejected' && !message) {
    throw new AppError('Please add a message explaining the rejection', 400);
  }

  let interviewAt = null;

  if (input.interviewAt) {
    const parsed = new Date(input.interviewAt);

    if (Number.isNaN(parsed.getTime())) {
      throw new AppError('Interview date is not a valid date', 400);
    }

    if (status === 'rejected') {
      throw new AppError('An interview cannot be scheduled on a rejected application', 400);
    }

    interviewAt = parsed;
  }

  const update = {
    status,
    employerMessage: message,
    // Deciding on an application means it was read, whatever route got here.
    viewedByEmployer: true,
  };

  if (status === 'rejected') {
    // Clear any slot booked before the employer changed their mind.
    update.interview = { scheduledAt: null, mode: '', location: '', message: '' };
  } else if (interviewAt) {
    update.interview = {
      scheduledAt: interviewAt,
      mode: input.interviewMode ?? '',
      location: String(input.interviewLocation ?? '').trim(),
      message,
    };
  }

  const application = await JobApplication.findOneAndUpdate(
    { _id: id, employerProfile: employerProfile._id },
    {
      $set: update,
      $push: {
        statusHistory: { status, message, interviewAt, changedAt: new Date() },
      },
    },
    { new: true, runValidators: true },
  )
    .populate('job', 'title companyName location type salary description skills experience education benefits status')
    .populate('candidateProfile')
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Backfill the timestamp when the decision is what first marked it read.
  if (!application.viewedAt) {
    application.viewedAt = new Date();
    await JobApplication.updateOne(
      { _id: application._id },
      { $set: { viewedAt: application.viewedAt } },
    );
  }

  const companyName = application.job?.companyName || employerProfile.companyName || '';
  const copy = buildStatusNotification({
    status,
    jobTitle: application.job?.title ?? '',
    companyName,
    message,
    interviewAt,
  });

  notify({
    recipientEmail: application.candidateEmail,
    recipientRole: 'candidate',
    type: interviewAt ? 'interview_scheduled' : (NOTIFICATION_TYPE_BY_STATUS[status] ?? 'general'),
    title: interviewAt ? 'Interview scheduled' : copy.title,
    message: copy.message,
    link: '/candidate/dashboard',
    meta: {
      applicationId: String(application._id),
      jobId: application.job?._id ? String(application.job._id) : null,
      jobTitle: application.job?.title ?? '',
      companyName,
      status,
      interviewAt,
      employerMessage: message,
    },
  });

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
    .select(CANDIDATE_APPLICATION_FIELDS)
    .lean();

  return application; // may be null — controller decides response shape
}
