import { z } from 'zod';

export const stripeSettingsSchema = z
  .object({
    secretKey: z
      .string()
      .trim()
      .regex(/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/, 'Invalid Stripe secret key format')
      .optional(),
    publishableKey: z
      .string()
      .trim()
      .regex(/^pk_(test|live)_[A-Za-z0-9]+$/, 'Invalid Stripe publishable key format')
      .optional(),
    webhookSecret: z
      .string()
      .trim()
      .regex(/^whsec_[A-Za-z0-9]+$/, 'Invalid Stripe webhook secret format')
      .optional(),
  })
  .refine(
    (value) => value.secretKey || value.publishableKey || value.webhookSecret,
    { message: 'Provide at least one Stripe setting to update' },
  );

export const emailSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    host: z.string().trim().min(3).max(200).optional(),
    port: z.number().int().min(1).max(65535).optional(),
    user: z.string().trim().min(3).max(200).optional(),
    pass: z.string().min(1).max(200).optional(),
    from: z.string().trim().min(3).max(200).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Provide at least one email setting to update',
  });

export const msg91SettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    authKey: z.string().trim().min(10).max(100).optional(),
    senderId: z.string().trim().min(3).max(10).optional(),
    templateId: z.string().trim().min(10).max(50).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: 'Provide at least one MSG91 setting to update',
  });
