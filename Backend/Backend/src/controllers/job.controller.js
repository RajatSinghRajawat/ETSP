import {
  createJob,
  getJobById,
  getJobs,
  getMyJobs,
  updateJob,
} from '../services/job.service.js';

export async function createJobPost(request, reply) {
  const job = await createJob(request.user, request.body);

  return reply.code(201).send({
    success: true,
    message: 'Job posted successfully',
    data: job,
  });
}

export async function updateJobPost(request) {
  const job = await updateJob(request.user, request.params.id, request.body);

  return {
    success: true,
    message: 'Job updated successfully',
    data: job,
  };
}

export async function getMyJobPosts(request) {
  const jobs = await getMyJobs(request.user);

  return {
    success: true,
    message: 'Jobs fetched successfully',
    data: jobs,
  };
}

export async function getJobPosts(request) {
  const jobs = await getJobs(request.query, request.user);

  return {
    success: true,
    message: 'Jobs fetched successfully',
    data: jobs,
  };
}

export async function getJobPost(request) {
  const job = await getJobById(request.params.id);

  return {
    success: true,
    message: 'Job fetched successfully',
    data: job,
  };
}
