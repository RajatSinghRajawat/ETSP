import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { emailService } from './email.service.js';
import { isSmsEnabled, sendOtpSms } from './sms.service.js';
import { User } from '../models/user.model.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

// Static test accounts (non-production only) for repeatable login testing.
const STATIC_TEST_OTP = '123456';
const TEST_ACCOUNTS = {
  'admin@test.com': 'admin',
  'admin@ets.local': 'admin',
  'admin@admin.com': 'admin',
  'employer@test.com': 'employer',
  'candidate@test.com': 'candidate',
};

class AuthService {
  generateOtp() {
    return String(randomInt(100000, 999999));
  }

  isTestAccount(email) {
    return (
      env.NODE_ENV !== 'production' &&
      Object.prototype.hasOwnProperty.call(TEST_ACCOUNTS, email)
    );
  }

  createAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }

  getTokenFromHeader(authorizationHeader) {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required', 401);
    }

    return authorizationHeader.replace('Bearer ', '').trim();
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new AppError('Invalid or expired authentication token', 401);
    }
  }

  async getRegisteredAccount(email) {
    const [user, candidateProfile, employerProfile] = await Promise.all([
      User.findOne({ email }).select('email role isActive').lean(),
      CandidateProfile.findOne({ email }).select('email').lean(),
      EmployerProfile.findOne({ email }).select('email').lean(),
    ]);

    if (!user && !candidateProfile && !employerProfile) {
      throw new AppError('Email is not registered. Please create your profile first.', 404);
    }

    if (user && !user.isActive) {
      throw new AppError('This account is inactive. Please contact support.', 403);
    }

    return {
      user,
      role: user?.role ?? (employerProfile ? 'employer' : 'candidate'),
    };
  }

  async sendOtp(email) {
    const formattedEmail = email.toLowerCase().trim();

    if (this.isTestAccount(formattedEmail)) {
      return { message: `Test account: use static OTP ${STATIC_TEST_OTP}` };
    }

    const registeredAccount = await this.getRegisteredAccount(formattedEmail);

    const otp = this.generateOtp();
    const otpKey = `auth:otp:${formattedEmail}`;
    const ttlInSeconds = 600; // 10 minutes

    // Store in Redis
    try {
      await redis.set(otpKey, otp, 'EX', ttlInSeconds);
    } catch (err) {
      logger.error('Redis error storing OTP:', err);
      // Fallback or handle redis failure; let's throw AppError
      throw new AppError('Error generating OTP. Try again later.', 500);
    }

    // Deliver over every channel the admin has enabled: email (SMTP) and/or
    // SMS (MSG91, sent to the registered profile phone). Both services can be
    // toggled from the admin panel.
    const [emailEnabled, smsEnabled] = await Promise.all([
      emailService.isEnabled(),
      isSmsEnabled(),
    ]);

    let emailSent = false;
    let smsSent = false;

    if (emailEnabled) {
      emailSent = await emailService.sendOtpEmail(formattedEmail, otp);
    }

    if (smsEnabled) {
      const profile = await this.getProfileForRole(formattedEmail, registeredAccount.role);
      const phone = this.getProfilePhone(profile, registeredAccount.role);
      if (phone) {
        smsSent = await sendOtpSms(phone, otp);
      }
    }

    if (!emailSent && !smsSent) {
      if (!emailEnabled && !smsEnabled) {
        throw new AppError(
          'Login is temporarily unavailable — no delivery service is enabled. Please contact support.',
          503,
        );
      }

      throw new AppError('Failed to send OTP. Please try again in a moment.', 500);
    }

    const channels = [emailSent && 'email', smsSent && 'SMS'].filter(Boolean).join(' and ');

    return { message: `OTP sent successfully via ${channels}` };
  }

  async getProfileForRole(email, role) {
    if (role === 'candidate') {
      return CandidateProfile.findOne({ email }).select('_id email phone').lean();
    }

    return EmployerProfile.findOne({ email }).select('_id email phoneNumber').lean();
  }

  getProfilePhone(profile, role) {
    return role === 'candidate' ? profile?.phone : profile?.phoneNumber;
  }

  async issueTokenForUser(user) {
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = this.createAccessToken(user);

    return {
      message: 'Logged in successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyOtp(email, otp) {
    const formattedEmail = email.toLowerCase().trim();

    if (this.isTestAccount(formattedEmail)) {
      if (otp !== STATIC_TEST_OTP) {
        throw new AppError('Invalid OTP', 400);
      }

      const role = TEST_ACCOUNTS[formattedEmail];
      let user = await User.findOne({ email: formattedEmail });
      if (!user) {
        user = await User.create({ email: formattedEmail, role, isActive: true });
      }

      return this.issueTokenForUser(user);
    }

    const registeredAccount = await this.getRegisteredAccount(formattedEmail);
    const otpKey = `auth:otp:${formattedEmail}`;

    const storedOtp = await redis.get(otpKey);
    if (!storedOtp) {
      throw new AppError('OTP expired or not found', 400);
    }

    if (storedOtp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Remove OTP after verification
    await redis.del(otpKey);

    let user = await User.findOne({ email: formattedEmail });
    if (!user) {
      user = await User.create({ email: formattedEmail, role: registeredAccount.role });
    }

    // A successful email OTP proves email ownership — feeds the EXCEL
    // verified badge (email + phone). Fire-and-forget.
    CandidateProfile.updateOne(
      { email: formattedEmail },
      { $set: { emailVerified: true } },
    ).catch(() => {});

    return this.issueTokenForUser(user);
  }

  async switchProfile(authorizationHeader, targetRole) {
    const token = this.getTokenFromHeader(authorizationHeader);
    const decoded = this.verifyAccessToken(token);
    const email = decoded.email?.toLowerCase().trim();
    const currentRole = decoded.role;

    if (!email) {
      throw new AppError('Invalid authentication token payload', 401);
    }

    if (!['candidate', 'employer'].includes(currentRole)) {
      throw new AppError('This account cannot switch profiles', 403);
    }

    const currentProfile = await this.getProfileForRole(email, currentRole);
    if (!currentProfile) {
      throw new AppError(`No ${currentRole} profile found for this account`, 404);
    }

    const targetProfile = await this.getProfileForRole(email, targetRole);
    if (!targetProfile) {
      throw new AppError(`No ${targetRole} profile found for this account`, 404);
    }

    if (this.getProfilePhone(currentProfile, currentRole) !== this.getProfilePhone(targetProfile, targetRole)) {
      throw new AppError('Profile switch requires the same email and phone number on both profiles', 409);
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, role: targetRole });
    }

    if (!user.isActive) {
      throw new AppError('This account is inactive. Please contact support.', 403);
    }

    user.role = targetRole;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = this.createAccessToken(user);

    return {
      message: `Switched to ${targetRole} profile successfully`,
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export const authService = new AuthService();
