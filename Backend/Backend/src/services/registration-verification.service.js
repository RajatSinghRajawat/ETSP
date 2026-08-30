import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { mobileLookupVariants, normalizeIndianMobile } from '../utils/phone.js';
import { emailService } from './email.service.js';
import {
  OTP_CHANNEL_LABELS,
  deliverOtp,
  isOtpChannelEnabled,
  maskPhone,
} from './otp-delivery.service.js';

/**
 * Pre-registration OTP verification.
 *
 * The login OTP flow only works for accounts that already exist, so signup needs
 * its own: prove the email and the phone belong to you BEFORE the profile is
 * created. A confirmed check-in is parked in Redis under the address itself, and
 * the create-profile service consumes it — the client never gets to assert its
 * own `emailVerified` / `phoneVerified`.
 */

const OTP_TTL_SECONDS = 600; // 10 minutes to type the code in
const VERIFIED_TTL_SECONDS = 3600; // 1 hour to finish the rest of the form
const RESEND_COOLDOWN_SECONDS = 60;
const STATIC_DEV_OTP = '123456';

const PHONE_CHANNELS = ['sms', 'whatsapp'];

const otpKey = (kind, value) => `reg:otp:${kind}:${value}`;
const verifiedKey = (kind, value) => `reg:ok:${kind}:${value}`;
const cooldownKey = (kind, value) => `reg:cd:${kind}:${value}`;

function normalizeEmail(input) {
  const email = String(input ?? '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Valid email is required', 400);
  }

  return email;
}

function normalizePhone(input) {
  const phone = normalizeIndianMobile(input);

  if (!phone) {
    throw new AppError('Enter a valid 10-digit Indian mobile number', 400);
  }

  return phone;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Redis is optional elsewhere in the app, but verification cannot work without it. */
async function redisSet(key, value, ttlSeconds) {
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (error) {
    logger.error('Redis error during registration verification', { message: error.message, key });
    throw new AppError('Verification is temporarily unavailable. Try again later.', 503);
  }
}

async function redisGet(key) {
  try {
    return await redis.get(key);
  } catch (error) {
    logger.error('Redis error during registration verification', { message: error.message, key });
    throw new AppError('Verification is temporarily unavailable. Try again later.', 503);
  }
}

/** Block a second OTP within the cooldown, so the button cannot be spammed. */
async function assertNotCoolingDown(kind, value) {
  const active = await redisGet(cooldownKey(kind, value));

  if (active) {
    throw new AppError('A code was just sent. Please wait a minute before requesting another.', 429);
  }
}

/**
 * Signing up with an address that already has an employer account is a dead end,
 * so say so at the OTP step instead of after the whole form is filled in.
 */
async function assertEmailFree(email) {
  const [profile, user] = await Promise.all([
    EmployerProfile.findOne({ email }).select('_id').lean(),
    User.findOne({ email }).select('_id role').lean(),
  ]);

  if (profile) {
    throw new AppError(
      'This email is already registered as an employer. Please login instead.',
      409,
    );
  }

  if (user?.role === 'admin') {
    throw new AppError('This email cannot be used for employer registration.', 409);
  }
}

async function assertPhoneFree(phone) {
  const profile = await EmployerProfile.findOne({
    phoneNumber: { $in: mobileLookupVariants(phone) },
  })
    .select('_id')
    .lean();

  if (profile) {
    throw new AppError(
      'This phone number is already registered as an employer. Please login instead.',
      409,
    );
  }
}

export async function sendRegistrationEmailOtp(input) {
  const email = normalizeEmail(input?.email);

  await assertEmailFree(email);

  if (await redisGet(verifiedKey('email', email))) {
    return { alreadyVerified: true, destination: email, message: 'Email is already verified' };
  }

  await assertNotCoolingDown('email', email);

  const otp = generateOtp();
  const enabled = await emailService.isEnabled();

  if (!enabled) {
    if (env.NODE_ENV === 'production') {
      throw new AppError('Email service is not configured yet. Please contact support.', 503);
    }

    await redisSet(otpKey('email', email), STATIC_DEV_OTP, OTP_TTL_SECONDS);
    await redisSet(cooldownKey('email', email), '1', RESEND_COOLDOWN_SECONDS);

    return {
      alreadyVerified: false,
      destination: email,
      message: `Email is not configured — dev mode accepts OTP ${STATIC_DEV_OTP}`,
    };
  }

  await redisSet(otpKey('email', email), otp, OTP_TTL_SECONDS);

  const sent = await deliverOtp('email', { email }, otp);

  if (!sent) {
    throw new AppError('Could not send the verification code by email. Please try again.', 502);
  }

  await redisSet(cooldownKey('email', email), '1', RESEND_COOLDOWN_SECONDS);

  return {
    alreadyVerified: false,
    destination: email,
    message: `Verification code sent to ${email}`,
  };
}

export async function sendRegistrationPhoneOtp(input) {
  const phone = normalizePhone(input?.phone);
  const channel = input?.channel ?? null;

  if (channel !== null && !PHONE_CHANNELS.includes(channel)) {
    throw new AppError('Choose where to receive the code: SMS or WhatsApp', 400);
  }

  await assertPhoneFree(phone);

  if (await redisGet(verifiedKey('phone', phone))) {
    return {
      alreadyVerified: true,
      destination: maskPhone(phone),
      message: 'Phone number is already verified',
    };
  }

  await assertNotCoolingDown('phone', phone);

  const [smsEnabled, whatsappEnabled] = await Promise.all([
    isOtpChannelEnabled('sms'),
    isOtpChannelEnabled('whatsapp'),
  ]);

  if (!smsEnabled && !whatsappEnabled) {
    if (env.NODE_ENV === 'production') {
      throw new AppError('SMS service is not configured yet. Please contact support.', 503);
    }

    await redisSet(otpKey('phone', phone), STATIC_DEV_OTP, OTP_TTL_SECONDS);
    await redisSet(cooldownKey('phone', phone), '1', RESEND_COOLDOWN_SECONDS);

    return {
      alreadyVerified: false,
      destination: maskPhone(phone),
      message: `SMS is not configured — dev mode accepts OTP ${STATIC_DEV_OTP}`,
    };
  }

  const available = { sms: smsEnabled, whatsapp: whatsappEnabled };
  const chosen = channel ?? (smsEnabled ? 'sms' : 'whatsapp');
  const label = OTP_CHANNEL_LABELS[chosen];

  if (!available[chosen]) {
    const other = chosen === 'sms' ? OTP_CHANNEL_LABELS.whatsapp : OTP_CHANNEL_LABELS.sms;
    throw new AppError(
      `Verification via ${label} is currently unavailable. Please choose ${other} instead.`,
      503,
    );
  }

  const otp = generateOtp();
  await redisSet(otpKey('phone', phone), otp, OTP_TTL_SECONDS);

  const sent = await deliverOtp(chosen, { phone }, otp);

  if (!sent) {
    throw new AppError(
      `Could not send the verification code via ${label}. Try again or choose another option.`,
      502,
    );
  }

  await redisSet(cooldownKey('phone', phone), '1', RESEND_COOLDOWN_SECONDS);

  const destination = maskPhone(phone);

  return {
    alreadyVerified: false,
    channel: chosen,
    destination,
    message: `Verification code sent via ${label} to ${destination}`,
  };
}

async function confirmOtp(kind, value, otp) {
  const code = String(otp ?? '').trim();

  if (!/^\d{4,8}$/.test(code)) {
    throw new AppError('Enter the code you received', 400);
  }

  if (await redisGet(verifiedKey(kind, value))) {
    return true;
  }

  const stored = await redisGet(otpKey(kind, value));

  if (!stored) {
    throw new AppError('OTP expired or not found. Request a new code.', 400);
  }

  if (stored !== code) {
    throw new AppError('Invalid OTP', 400);
  }

  try {
    await redis.del(otpKey(kind, value));
  } catch {
    // The key expires on its own; a failed delete must not fail the verification.
  }

  await redisSet(verifiedKey(kind, value), '1', VERIFIED_TTL_SECONDS);

  return true;
}

export async function confirmRegistrationEmailOtp(input) {
  const email = normalizeEmail(input?.email);
  await confirmOtp('email', email, input?.otp);

  return { emailVerified: true, email };
}

export async function confirmRegistrationPhoneOtp(input) {
  const phone = normalizePhone(input?.phone);
  await confirmOtp('phone', phone, input?.otp);

  return { phoneVerified: true, phone };
}

/** Lets a reloaded signup form restore its verified badges. */
export async function getRegistrationVerificationStatus(query = {}) {
  const email = query.email ? normalizeEmail(query.email) : null;
  const phone = query.phone ? normalizeIndianMobile(query.phone) : null;

  const [emailVerified, phoneVerified] = await Promise.all([
    email ? redisGet(verifiedKey('email', email)) : null,
    phone ? redisGet(verifiedKey('phone', phone)) : null,
  ]);

  return {
    emailVerified: Boolean(emailVerified),
    phoneVerified: Boolean(phoneVerified),
  };
}

/**
 * Called by profile creation: both addresses must carry a live confirmation.
 * The flags are cleared on success so one verification cannot seed two signups.
 */
export async function consumeRegistrationVerification({ email, phone }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const [emailOk, phoneOk] = await Promise.all([
    redisGet(verifiedKey('email', normalizedEmail)),
    redisGet(verifiedKey('phone', normalizedPhone)),
  ]);

  if (!emailOk) {
    throw new AppError('Please verify your email address before registering.', 403);
  }

  if (!phoneOk) {
    throw new AppError('Please verify your phone number before registering.', 403);
  }

  try {
    await redis.del(verifiedKey('email', normalizedEmail), verifiedKey('phone', normalizedPhone));
  } catch {
    // Both keys expire on their own — a failed cleanup must not fail the signup.
  }

  return { emailVerified: true, phoneVerified: true };
}
