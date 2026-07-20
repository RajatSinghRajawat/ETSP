import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .transform(v => v.toLowerCase()),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string()
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .transform(v => v.toLowerCase()),
    otp: z.string().length(6, 'OTP must be exactly 6 characters'),
  }),
});

export const switchProfileSchema = z.object({
  body: z.object({
    role: z.enum(['candidate', 'employer']),
  }),
});
