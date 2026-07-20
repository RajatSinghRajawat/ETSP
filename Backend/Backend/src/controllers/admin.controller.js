import * as adminService from '../services/admin.service.js';
import * as importedEmployerService from '../services/imported-employer.service.js';
import { askAdminAssistant } from '../services/admin-assistant.service.js';

function ok(message, data) {
  return { success: true, message, data };
}

export async function getStats() {
  const stats = await adminService.getDashboardStats();
  return ok('Dashboard stats fetched successfully', stats);
}

export async function getAnalytics(request) {
  const data = await adminService.getAnalytics(request.query);
  return ok('Dashboard analytics fetched successfully', data);
}

export async function postAssistant(request) {
  const data = await askAdminAssistant(request.body);
  return ok('Assistant replied successfully', data);
}

export async function getUsers(request) {
  const data = await adminService.listUsers(request.query);
  return ok('Users fetched successfully', data);
}

export async function patchUser(request) {
  const data = await adminService.updateUser(request.params.id, request.body);
  return ok('User updated successfully', data);
}

export async function removeUser(request) {
  await adminService.deleteUser(request.params.id);
  return ok('User deleted successfully', { id: request.params.id });
}

export async function getCandidates(request) {
  const data = await adminService.listCandidates(request.query);
  return ok('Candidate profiles fetched successfully', data);
}

export async function getCandidate(request) {
  const data = await adminService.getCandidate(request.params.id);
  return ok('Candidate profile fetched successfully', data);
}

export async function removeCandidate(request) {
  await adminService.deleteCandidate(request.params.id);
  return ok('Candidate profile deleted successfully', { id: request.params.id });
}

export async function getEmployers(request) {
  const data = await adminService.listEmployers(request.query);
  return ok('Employer profiles fetched successfully', data);
}

export async function getEmployer(request) {
  const data = await adminService.getEmployer(request.params.id);
  return ok('Employer profile fetched successfully', data);
}

export async function removeEmployer(request) {
  await adminService.deleteEmployer(request.params.id);
  return ok('Employer profile deleted successfully', { id: request.params.id });
}

export async function getJobs(request) {
  const data = await adminService.listJobs(request.query);
  return ok('Jobs fetched successfully', data);
}

export async function getJob(request) {
  const data = await adminService.getJob(request.params.id);
  return ok('Job fetched successfully', data);
}

export async function patchJob(request) {
  const data = await adminService.updateJob(request.params.id, request.body);
  return ok('Job updated successfully', data);
}

export async function removeJob(request) {
  await adminService.deleteJob(request.params.id);
  return ok('Job deleted successfully', { id: request.params.id });
}

export async function getApplications(request) {
  const data = await adminService.listApplications(request.query);
  return ok('Applications fetched successfully', data);
}

export async function patchApplication(request) {
  const data = await adminService.updateApplication(request.params.id, request.body);
  return ok('Application updated successfully', data);
}

export async function removeApplication(request) {
  await adminService.deleteApplication(request.params.id);
  return ok('Application deleted successfully', { id: request.params.id });
}

export async function importEmployersExcel(request, reply) {
  const file = await request.file({ limits: { fileSize: 10 * 1024 * 1024 } });
  const data = await importedEmployerService.importEmployersFromExcel(file);

  return reply.code(201).send(ok('Employer Excel imported successfully', data));
}

export async function getImportedEmployers(request) {
  const data = await importedEmployerService.getImportedEmployers(request.query);
  return ok('Imported employers fetched successfully', data);
}

export async function removeImportedEmployer(request) {
  await importedEmployerService.deleteImportedEmployer(request.params.id);
  return ok('Imported employer deleted successfully', { id: request.params.id });
}
