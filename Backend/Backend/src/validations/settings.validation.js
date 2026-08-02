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
    // When false, plan gating + Stripe checkouts are off (site runs free).
    subscriptionsEnabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.secretKey ||
      value.publishableKey ||
      value.webhookSecret ||
      value.subscriptionsEnabled !== undefined,
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

const legalSectionSchema = z.object({
  id: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(160),
  body: z.array(z.string().trim().min(1).max(2000)).min(1).max(20),
});

const legalPageSchema = z
  .object({
    heroTitle: z.string().trim().max(160).optional(),
    heroSubtitle: z.string().trim().max(400).optional(),
    lastUpdated: z.string().trim().max(60).optional(),
    intro: z.string().trim().max(4000).optional(),
    sections: z.array(legalSectionSchema).max(20).optional(),
    contactCardTitle: z.string().trim().max(160).optional(),
    contactCardBody: z.string().trim().max(2000).optional(),
  })
  .optional();

const contactSchema = z
  .object({
    email: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(60).optional(),
    address: z.string().trim().max(300).optional(),
    workingHours: z.string().trim().max(120).optional(),
    heroTitle: z.string().trim().max(160).optional(),
    heroSubtitle: z.string().trim().max(400).optional(),
    formTitle: z.string().trim().max(160).optional(),
    formSubmitLabel: z.string().trim().max(80).optional(),
  })
  .optional();

const aboutSchema = z
  .object({
    heroOverline: z.string().trim().max(80).optional(),
    heroTitle: z.string().trim().max(160).optional(),
    heroSubtitle: z.string().trim().max(300).optional(),
    primaryCtaLabel: z.string().trim().max(60).optional(),
    primaryCtaPath: z.string().trim().max(120).optional(),
    secondaryCtaLabel: z.string().trim().max(60).optional(),
    secondaryCtaPath: z.string().trim().max(120).optional(),
    missionTitle: z.string().trim().max(160).optional(),
    missionBody: z.array(z.string().trim().min(1).max(2000)).max(6).optional(),
    missionImageUrl: z.string().trim().max(500).optional(),
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
    valuesTitle: z.string().trim().max(160).optional(),
    valuesSubtitle: z.string().trim().max(300).optional(),
    values: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(60),
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().max(500),
          iconKey: z.string().trim().max(60).optional(),
        }),
      )
      .max(8)
      .optional(),
    journeyTitle: z.string().trim().max(160).optional(),
    journeySubtitle: z.string().trim().max(300).optional(),
    milestones: z
      .array(
        z.object({
          year: z.string().trim().min(1).max(20),
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().max(400),
        }),
      )
      .max(12)
      .optional(),
    teamTitle: z.string().trim().max(160).optional(),
    teamSubtitle: z.string().trim().max(400).optional(),
    team: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(120),
          role: z.string().trim().min(1).max(120),
          image: z.string().trim().max(500).optional(),
          experience: z.string().trim().max(60).optional(),
        }),
      )
      .max(12)
      .optional(),
    ctaTitle: z.string().trim().max(200).optional(),
    ctaSubtitle: z.string().trim().max(500).optional(),
    ctaPrimaryLabel: z.string().trim().max(60).optional(),
    ctaPrimaryPath: z.string().trim().max(120).optional(),
    ctaSecondaryLabel: z.string().trim().max(60).optional(),
    ctaSecondaryPath: z.string().trim().max(120).optional(),
  })
  .optional();

const heroSchema = z
  .object({
    badge: z.string().trim().max(120).optional(),
    headlinePrefix: z.string().trim().max(80).optional(),
    headlineAccent: z.string().trim().max(80).optional(),
    headlineSuffix: z.string().trim().max(80).optional(),
    subtitle: z.string().trim().max(500).optional(),
    searchKeywordPlaceholder: z.string().trim().max(120).optional(),
    searchLocationPlaceholder: z.string().trim().max(80).optional(),
    searchButtonLabel: z.string().trim().max(40).optional(),
    trustLine: z.string().trim().max(200).optional(),
    hiringPrompt: z.string().trim().max(80).optional(),
    hiringCtaLabel: z.string().trim().max(60).optional(),
    hiringCtaPath: z.string().trim().max(120).optional(),
    floatingBadge1Title: z.string().trim().max(80).optional(),
    floatingBadge1Subtitle: z.string().trim().max(80).optional(),
    floatingBadge2Title: z.string().trim().max(80).optional(),
    floatingBadge2Subtitle: z.string().trim().max(80).optional(),
  })
  .optional();

const jobProfilesSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    subtitle: z.string().trim().max(400).optional(),
    exploreLabel: z.string().trim().max(60).optional(),
    items: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(60),
          title: z.string().trim().min(1).max(120),
          description: z.string().trim().max(400),
          searchQuery: z.string().trim().max(120).optional(),
          color: z.string().trim().max(40).optional(),
          bgColor: z.string().trim().max(80).optional(),
          iconKey: z.string().trim().max(60).optional(),
        }),
      )
      .max(24)
      .optional(),
  })
  .optional();

const localeContentSchema = z
  .object({
    contact: contactSchema,
    about: aboutSchema,
    hero: heroSchema,
    jobProfiles: jobProfilesSchema,
    privacy: legalPageSchema,
    terms: legalPageSchema,
    cookies: legalPageSchema,
  })
  .optional();

const socialSchema = z
  .object({
    facebook: socialUrl,
    twitter: socialUrl,
    linkedin: socialUrl,
    instagram: socialUrl,
  })
  .optional();

/** Bilingual + legacy flat / lang-scoped update payloads. */
export const siteContentSchema = z
  .object({
    lang: z.enum(['en', 'hi']).optional(),
    social: socialSchema,
    en: localeContentSchema,
    hi: localeContentSchema,
    contact: contactSchema,
    about: aboutSchema,
    hero: heroSchema,
    jobProfiles: jobProfilesSchema,
    privacy: legalPageSchema,
    terms: legalPageSchema,
    cookies: legalPageSchema,
  })
  .refine(
    (value) =>
      value.social ||
      value.en ||
      value.hi ||
      value.contact ||
      value.about ||
      value.hero ||
      value.jobProfiles ||
      value.privacy ||
      value.terms ||
      value.cookies,
    { message: 'Provide at least one section to update' },
  );

export const siteContentTranslateSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    sections: z
      .array(
        z.enum([
          'contact',
          'about',
          'hero',
          'jobProfiles',
          'privacy',
          'terms',
          'cookies',
        ]),
      )
      .max(7)
      .optional(),
  }),
);
