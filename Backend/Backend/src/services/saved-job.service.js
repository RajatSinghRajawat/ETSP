import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Job } from '../models/job.model.js';
import { SavedJob } from '../models/saved-job.model.js';
import { AppError } from '../utils/app-error.js';

async function getCandidateForUser(user) {
  if (!user || user.role !== 'candidate') {
    throw new AppError('Candidate account required', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email }).select('_id email').lean();

  if (!candidate) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return candidate;
}

export async function saveJob(user, jobId) {
  if (!/^[0-9a-fA-F]{24}$/.test(String(jobId))) {
    throw new AppError('Invalid job id', 400);
  }

  const candidate = await getCandidateForUser(user);
  const job = await Job.findById(jobId).select('_id').lean();

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

  // Drop entries whose underlying job has since been removed.
  return saved
    .filter((entry) => entry.job)
    .map((entry) => ({
      _id: entry._id,
      job: entry.job,
      savedAt: entry.createdAt,
    }));
}
