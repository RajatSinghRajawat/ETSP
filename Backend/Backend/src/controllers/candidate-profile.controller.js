import {
  createCandidateProfile,
  getCandidateProfileByEmail,
  getCandidateProfile,
  getCandidateProfiles,
  getFeaturedCandidateProfiles,
  updateMyCandidateProfile,
} from '../services/candidate-profile.service.js';
import { uploadCandidateProfileImage } from '../services/candidate-profile-upload.service.js';
import { listMyFollows } from '../services/follow.service.js';
import {
  confirmPhoneVerification,
  sendPhoneVerificationOtp,
} from '../services/phone-verification.service.js';
import { unlockCandidate } from '../services/unlock.service.js';
import { AppError } from '../utils/app-error.js';

export async function createProfile(request, reply) {
  if (request.user.role !== 'candidate') {
    throw new AppError('Candidate profile creation requires candidate account token', 403);
  }

  const profile = await createCandidateProfile({
    ...request.body,
    email: request.user.email,
  });

  return reply.code(201).send({
    success: true,
    message: 'Candidate profile submitted successfully',
    data: profile,
  });
}

export async function getProfiles(request) {
  if (request.user.role !== 'employer' && request.user.role !== 'admin') {
    throw new AppError('Candidate directory access requires employer account token', 403);
  }

  const profiles = await getCandidateProfiles(request.query, request.user);

  return {
    success: true,
    message: 'Candidate profiles fetched successfully',
    data: profiles,
  };
}

export async function getProfile(request) {
  const profile = await getCandidateProfile(request.params.id, request.user);

  return {
    success: true,
    message: 'Candidate profile fetched successfully',
    data: profile,
  };
}

export async function postUnlockProfile(request) {
  if (request.user.role !== 'employer') {
    throw new AppError('Unlocking profiles requires an employer account', 403);
  }

  const data = await unlockCandidate(request.user, request.params.id, {
    jobId: request.body?.jobId ?? null,
  });

  return {
    success: true,
    message: data.alreadyUnlocked
      ? 'Profile is already unlocked'
      : 'Profile unlocked successfully',
    data,
  };
}

export async function postVerifyPhone(request) {
  const data = await sendPhoneVerificationOtp(request.user);

  return {
    success: true,
    message: data.message,
    data,
  };
}

export async function postVerifyPhoneConfirm(request) {
  const data = await confirmPhoneVerification(request.user, request.body?.otp);

  return {
    success: true,
    message: 'Phone number verified successfully',
    data,
  };
}

export async function getMyFollows(request) {
  const data = await listMyFollows(request.user);

  return {
    success: true,
    message: 'Followed employers fetched successfully',
    data,
  };
}

export async function getFeatured(request) {
  const result = await getFeaturedCandidateProfiles(request.query);

  return {
    success: true,
    message: 'Featured candidates fetched successfully',
    data: result,
  };
}

export async function getMyProfile(request) {
  if (request.user.role !== 'candidate') {
    throw new AppError('Candidate profile access requires candidate account token', 403);
  }

  const profile = await getCandidateProfileByEmail(request.user.email);

  return {
    success: true,
    message: 'Candidate profile fetched successfully',
    data: profile,
  };
}

export async function updateMyProfile(request) {
  if (request.user.role !== 'candidate') {
    throw new AppError('Candidate profile update requires candidate account token', 403);
  }

  const profile = await updateMyCandidateProfile(request.user, request.body);

  return {
    success: true,
    message: 'Candidate profile updated successfully',
    data: profile,
  };
}

export async function uploadProfileImage(request, reply) {
  const file = await request.file();
  const upload = await uploadCandidateProfileImage(file);

  return reply.code(201).send({
    success: true,
    message: 'Candidate profile image uploaded successfully',
    data: upload,
  });
}
