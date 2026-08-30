import { z } from 'zod';

const emailField = z.string().trim().toLowerCase().email('Valid email is required');
const phoneField = z.string().trim().min(1, 'Phone number is required');
const otpField = z.string().trim().regex(/^\d{4,8}$/, 'Enter the code you received');

export const sendEmailOtpSchema = z.object({
  email: emailField,
});

export const confirmEmailOtpSchema = z.object({
  email: emailField,
  otp: otpField,
});

export const sendPhoneOtpSchema = z.object({
  phone: phoneField,
  // Omitted means "let the server pick" — SMS when it is on, WhatsApp otherwise.
  channel: z.enum(['sms', 'whatsapp']).nullish(),
});

export const confirmPhoneOtpSchema = z.object({
  phone: phoneField,
  otp: otpField,
});
