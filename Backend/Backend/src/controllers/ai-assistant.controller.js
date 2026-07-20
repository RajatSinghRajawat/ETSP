import { refineCandidateProfile } from '../services/ai-assistant.service.js';
import { reindexAllJobs, searchJobsBySemantics } from '../services/job-rag.service.js';
import { AppError } from '../utils/app-error.js';

export async function refineCandidateProfileHandler(request) {
  if (request.user.role !== 'candidate') {
    throw new AppError('Profile refinement requires a candidate account token', 403);
  }

  const profile = await refineCandidateProfile(request.body?.answers);

  return {
    success: true,
    message: 'Profile refined successfully',
    data: profile,
  };
}

export async function searchJobsHandler(request) {
  const candidateEmail = request.user?.role === 'candidate' ? request.user.email : undefined;
  const result = await searchJobsBySemantics({
    query: request.body?.query,
    candidateEmail,
  });

  return {
    success: true,
    message: 'Jobs matched successfully',
    data: result,
  };
}

export async function reindexJobsHandler(request) {
  if (request.user?.role !== 'admin' && request.user?.role !== 'employer') {
    throw new AppError('Only admins or employers can trigger a reindex', 403);
  }

  const result = await reindexAllJobs();

  return {
    success: true,
    message: 'Job embeddings refreshed',
    data: result,
  };
}
