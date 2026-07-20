import {
  createEmployerProfile,
  getEmployerProfileByEmail,
  getEmployerProfile,
  getEmployerProfiles,
  updateEmployerProfileByEmail,
} from '../services/employer-profile.service.js';
import { uploadEmployerLogo } from '../services/employer-profile-upload.service.js';
import { findImportedEmployerPrefill } from '../services/imported-employer.service.js';
import { AppError } from '../utils/app-error.js';

export async function createProfile(request, reply) {
  const profile = await createEmployerProfile(request.body);

  return reply.code(201).send({
    success: true,
    message: 'Employer profile submitted successfully',
    data: profile,
  });
}

export async function getProfiles(request) {
  const profiles = await getEmployerProfiles(request.query);

  return {
    success: true,
    message: 'Employer profiles fetched successfully',
    data: profiles,
  };
}

export async function getProfile(request) {
  const profile = await getEmployerProfile(request.params.id);

  return {
    success: true,
    message: 'Employer profile fetched successfully',
    data: profile,
  };
}

export async function getMyProfile(request) {
  if (request.user.role !== 'employer') {
    throw new AppError('Employer profile access requires employer account token', 403);
  }

  const profile = await getEmployerProfileByEmail(request.user.email);

  return {
    success: true,
    message: 'Employer profile fetched successfully',
    data: profile,
  };
}

export async function updateMyProfile(request) {
  if (request.user.role !== 'employer') {
    throw new AppError('Employer profile update requires employer account token', 403);
  }

  const profile = await updateEmployerProfileByEmail(request.user.email, request.body);

  return {
    success: true,
    message: 'Employer profile updated successfully',
    data: profile,
  };
}

export async function getPrefill(request) {
  const prefill = await findImportedEmployerPrefill(request.query.identifier);

  return {
    success: true,
    message: 'Employer details fetched successfully',
    data: prefill,
  };
}

export async function uploadLogo(request, reply) {
  const file = await request.file();
  const upload = await uploadEmployerLogo(file);

  return reply.code(201).send({
    success: true,
    message: 'Employer logo uploaded successfully',
    data: upload,
  });
}
