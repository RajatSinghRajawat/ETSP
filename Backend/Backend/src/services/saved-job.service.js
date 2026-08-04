import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Job } from '../models/job.model.js';
import { SavedJob } from '../models/saved-job.model.js';
import { AppError } from '../utils/app-error.js';

async function getCandidateForUser(user) {
  if (!user || user.role !== 'candidate') {
    throw new AppError('Sign in with a candidate account to save jobs', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email }).select('_id email').lean();

  if (!candidate) {
    throw new AppError(
      'Complete your candidate profile before saving jobs',
      404,
    );
  }

  return candidate;
}

export async function saveJob(user, jobId) {
  if (!/^[0-9a-fA-F]{24}$/.test(String(jobId))) {
    throw new AppError('Invalid job id', 400);
  }

  const candidate = await getCandidateForUser(user);
  // Only a live, approved job can be saved. Unapproved jobs deliberately return
  // the same 404 as a missing one so the endpoint cannot be used to probe which
  // job ids exist but are still pending review.
  const job = await Job.findOne({ _id: jobId, status: 'active', approvalStatus: 'approved' })
    .select('_id')
    .lean();

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  try {
    const saved = await SavedJob.create({
      job: job._id,
      candidateProfile: candidate._id,
      candidateEmail: candidate.email,
    });

    return saved.toObject();
  } catch (error) {
    if (error?.code === 11000) {
      // Already saved — treat as idempotent success.
      return SavedJob.findOne({ job: job._id, candidateProfile: candidate._id }).lean();
    }

    throw error;
  }
}

export async function unsaveJob(user, jobId) {
  if (!/^[0-9a-fA-F]{24}$/.test(String(jobId))) {
    throw new AppError('Invalid job id', 400);
  }

  const candidate = await getCandidateForUser(user);
  await SavedJob.deleteOne({ job: jobId, candidateProfile: candidate._id });

  return { jobId: String(jobId) };
}

export async function getMySavedJobs(user) {
  const candidate = await getCandidateForUser(user);

  const saved = await SavedJob.find({ candidateProfile: candidate._id })
    .populate('job')
    .sort({ createdAt: -1 })
    .lean();

  // Drop entries whose underlying job has since been removed, or that an admin
  // has since unpublished — a saved bookmark must not outlive the approval.
  return saved
    .filter((entry) => entry.job && entry.job.approvalStatus === 'approved')
    .map((entry) => ({
      _id: entry._id,
      job: entry.job,
      savedAt: entry.createdAt,
    }));
}
