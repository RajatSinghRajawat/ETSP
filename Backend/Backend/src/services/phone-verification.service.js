import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { isSmsEnabled, sendOtpSms } from './sms.service.js';

const OTP_TTL_SECONDS = 600;
const STATIC_DEV_OTP = '123456';

const otpKey = (email) => `verify:phone:${email}`;

async function getCandidateOr404(user) {
  if (user.role !== 'candidate') {
    throw new AppError('Phone verification requires a candidate account', 403);
  }

  const candidate = await CandidateProfile.findOne({ email: user.email })
    .select('_id email phone phoneVerified')
    .lean();

  if (!candidate) {
    throw new AppError('Candidate profile not found for this account', 404);
  }

  return candidate;
}

/**
 * Send an OTP to the candidate's registered phone (MSG91). Outside production
 * the static dev OTP is accepted when SMS is not configured, so the verified
 * badge remains testable end-to-end.
 */
export async function sendPhoneVerificationOtp(user) {
  const candidate = await getCandidateOr404(user);

  if (candidate.phoneVerified) {
    return { alreadyVerified: true, message: 'Phone number is already verified' };
  }

  const smsEnabled = await isSmsEnabled();

  if (!smsEnabled) {
    if (env.NODE_ENV !== 'production') {
      await redis.set(otpKey(candidate.email), STATIC_DEV_OTP, 'EX', OTP_TTL_SECONDS);
      return {
        alreadyVerified: false,
        message: `SMS is not configured — dev mode accepts OTP ${STATIC_DEV_OTP}`,
      };
    }

    throw new AppError('SMS service is not configured yet. Please contact support.', 503);
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  try {
    await redis.set(otpKey(candidate.email), otp, 'EX', OTP_TTL_SECONDS);
  } catch (error) {
    logger.error('Redis error storing phone verification OTP', { message: error.message });
    throw new AppError('Error generating OTP. Try again later.', 500);
  }

  const sent = await sendOtpSms(candidate.phone, otp);

  if (!sent) {
    throw new AppError('Could not send the verification SMS. Try again later.', 502);
  }

  return { alreadyVerified: false, message: 'Verification code sent to your registered phone' };
}

export async function confirmPhoneVerification(user, otp) {
  const candidate = await getCandidateOr404(user);

  if (candidate.phoneVerified) {
    return { phoneVerified: true };
  }

  const stored = await redis.get(otpKey(candidate.email));

  if (!stored) {
    throw new AppError('OTP expired or not found. Request a new code.', 400);
  }

  if (stored !== String(otp).trim()) {
    throw new AppError('Invalid OTP', 400);
  }

  await redis.del(otpKey(candidate.email));

  await CandidateProfile.updateOne(
    { _id: candidate._id },
    { $set: { phoneVerified: true } },
  );

  return { phoneVerified: true };
}
