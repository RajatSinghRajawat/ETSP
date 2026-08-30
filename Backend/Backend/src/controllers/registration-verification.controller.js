import {
  confirmRegistrationEmailOtp,
  confirmRegistrationPhoneOtp,
  getRegistrationVerificationStatus,
  sendRegistrationEmailOtp,
  sendRegistrationPhoneOtp,
} from '../services/registration-verification.service.js';

export async function postEmailOtp(request) {
  const data = await sendRegistrationEmailOtp(request.body);

  return {
    success: true,
    message: data.message,
    data,
  };
}

export async function postEmailOtpConfirm(request) {
  const data = await confirmRegistrationEmailOtp(request.body);

  return {
    success: true,
    message: 'Email verified successfully',
    data,
  };
}

export async function postPhoneOtp(request) {
  const data = await sendRegistrationPhoneOtp(request.body);

  return {
    success: true,
    message: data.message,
    data,
  };
}

export async function postPhoneOtpConfirm(request) {
  const data = await confirmRegistrationPhoneOtp(request.body);

  return {
    success: true,
    message: 'Phone number verified successfully',
    data,
  };
}

export async function getVerificationStatus(request) {
  const data = await getRegistrationVerificationStatus(request.query);

  return {
    success: true,
    message: 'Verification status fetched successfully',
    data,
  };
}
