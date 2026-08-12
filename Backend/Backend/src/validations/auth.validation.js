import { z } from 'zod';
import { normalizeIndianMobile } from '../utils/phone.js';

const emailField = z.string()
  .trim()
  .email('Invalid email address')
  .transform(v => v.toLowerCase());

const phoneField = z.string()
  .trim()
  .transform(normalizeIndianMobile)
  .refine(Boolean, 'Enter a valid 10 digit mobile number');

/** Login accepts either channel, so exactly one identifier must be present. */
const identifierShape = {
  email: emailField.optional(),
  phone: phoneField.optional(),
};

const hasIdentifier = [
  (data) => Boolean(data.email || data.phone),
  { message: 'Email or mobile number is required', path: ['email'] },
];

export const sendOtpSchema = z.object({
  body: z.object(identifierShape).refine(...hasIdentifier),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    ...identifierShape,
    otp: z.string().length(6, 'OTP must be exactly 6 characters'),
  }).refine(...hasIdentifier),
});

export const switchProfileSchema = z.object({
  body: z.object({
    role: z.enum(['candidate', 'employer']),
  }),
});
