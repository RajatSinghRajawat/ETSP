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

// Social handles are optional, but a non-empty one must be a real URL so the
// footer never renders a link that goes nowhere.
const socialUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), 'Enter a full URL starting with https://')
  .optional();

export const siteContentSchema = z
  .object({
    contact: z
      .object({
        email: z.string().trim().max(200).optional(),
        phone: z.string().trim().max(60).optional(),
        address: z.string().trim().max(300).optional(),
        workingHours: z.string().trim().max(120).optional(),
      })
      .optional(),
    social: z
      .object({
        facebook: socialUrl,
        twitter: socialUrl,
        linkedin: socialUrl,
        instagram: socialUrl,
      })
      .optional(),
    about: z
      .object({
        heroTitle: z.string().trim().max(160).optional(),
        heroSubtitle: z.string().trim().max(300).optional(),
        storyTitle: z.string().trim().max(160).optional(),
        storyBody: z.string().trim().max(4000).optional(),
        stats: z
          .array(
            z.object({
              value: z.string().trim().min(1).max(40),
              label: z.string().trim().min(1).max(80),
            }),
          )
          .max(8)
          .optional(),
      })
      .optional(),
  })
  .refine((value) => value.contact || value.social || value.about, {
    message: 'Provide at least one section to update',
  });
