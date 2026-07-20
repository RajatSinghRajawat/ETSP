import { getMySavedJobs, saveJob, unsaveJob } from '../services/saved-job.service.js';

export async function postSavedJob(request, reply) {
  const saved = await saveJob(request.user, request.body?.jobId);

  return reply.code(201).send({
    success: true,
    message: 'Job saved successfully',
    data: saved,
  });
}

export async function deleteSavedJob(request) {
  const result = await unsaveJob(request.user, request.params.jobId);

  return {
    success: true,
    message: 'Job removed from saved list',
    data: result,
  };
}

export async function getSavedJobs(request) {
  const items = await getMySavedJobs(request.user);

  return {
    success: true,
    message: 'Saved jobs fetched successfully',
    data: { items },
  };
}
