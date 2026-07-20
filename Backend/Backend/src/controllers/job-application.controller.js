import { getAutoApplyStatus, setAutoApply } from '../services/auto-apply.service.js';
import {
  createJobApplication,
  getEmployerApplication,
  getEmployerApplications,
  getMyApplicationForJob,
  getMyCandidateApplications,
  updateEmployerApplicationStatus,
} from '../services/job-application.service.js';

export async function getAutoApply(request) {
  const data = await getAutoApplyStatus(request.user);

  return {
    success: true,
    message: 'Auto apply status fetched successfully',
    data,
  };
}

export async function postAutoApply(request) {
  const data = await setAutoApply(request.user, request.body.enabled);

  return {
    success: true,
    message: data.enabled
      ? `AI auto apply is on — applied to ${data.applied} matching job(s)`
      : 'AI auto apply turned off',
    data,
  };
}

export async function createApplication(request, reply) {
  const application = await createJobApplication(request.user, request.body);

  return reply.code(201).send({
    success: true,
    message: 'Application submitted successfully',
    data: application,
  });
}

export async function getMyEmployerApplications(request) {
  const applications = await getEmployerApplications(request.user, request.query);

  return {
    success: true,
    message: 'Applications fetched successfully',
    data: applications,
  };
}

export async function getMyEmployerApplication(request) {
  const application = await getEmployerApplication(request.user, request.params.id);

  return {
    success: true,
    message: 'Application fetched successfully',
    data: application,
  };
}

export async function patchEmployerApplication(request) {
  const application = await updateEmployerApplicationStatus(
    request.user,
    request.params.id,
    request.body?.status,
  );

  return {
    success: true,
    message: 'Application status updated successfully',
    data: application,
  };
}

export async function getMyApplications(request) {
  const applications = await getMyCandidateApplications(request.user, request.query);

  return {
    success: true,
    message: 'Applications fetched successfully',
    data: { items: applications },
  };
}

export async function getMyApplicationStatus(request) {
  const application = await getMyApplicationForJob(request.user, request.params.jobId);

  return {
    success: true,
    message: application ? 'Application found' : 'No application yet',
    data: { applied: Boolean(application), application: application ?? null },
  };
}
