import { z } from 'zod';

// Bare field schemas (no defaults). Defaults are applied only on create —
// zod defaults fire even through .partial(), which would silently reset
// omitted fields on updates.
const nameSchema = z.string().trim().min(1).max(100);
const descriptionSchema = z.string().trim().max(500);
const priceSchema = z.number().min(0).max(10_000_000);
const limitSchema = z.number().int().min(0).nullable();
const countSchema = z.number().int().min(0);

const featureFields = {
  // shared
  aiEnabled: z.boolean(),
  // employer
  maxActiveJobs: limitSchema,
  jobValidityDays: z.number().int().min(1).nullable(),
  featuredJobs: countSchema,
  searchFiltersEnabled: z.boolean(),
  chatEnabled: z.boolean(),
  screeningQuestionsEnabled: z.boolean(),
  unlockCreditsPerJob: countSchema,
  visibleExcelProfilesPerJob: limitSchema,
  dedicatedAccountManager: z.boolean(),
  creditAddonsEnabled: z.boolean(),
  perCvUnlockEnabled: z.boolean(),
  autoReplyEnabled: z.boolean(),
  // candidate
  maxApplications: limitSchema,
  verifiedBadgeEnabled: z.boolean(),
  featuredProfileEnabled: z.boolean(),
  searchBoostEnabled: z.boolean(),
  jobAlertsEnabled: z.boolean(),
  autoApplyEnabled: z.boolean(),
  profileBoostEnabled: z.boolean(),
  directMessageEmployersPerMonth: countSchema,
  visibilityToggleEnabled: z.boolean(),
  followEmployersEnabled: z.boolean(),
  resumeBuilderIncluded: z.boolean(),
  // legacy — accepted so old admin clients keep working
  maxJobPosts: limitSchema,
};

// Create defaults mirror the Mongoose schema: booleans false, counters 0,
// nullable limits null (= unlimited / not applicable).
const CREATE_DEFAULTS = {
  aiEnabled: false,
  maxActiveJobs: null,
  jobValidityDays: null,
  featuredJobs: 0,
  searchFiltersEnabled: false,
  chatEnabled: false,
  screeningQuestionsEnabled: false,
  unlockCreditsPerJob: 0,
  visibleExcelProfilesPerJob: null,
  dedicatedAccountManager: false,
  creditAddonsEnabled: false,
  perCvUnlockEnabled: false,
  autoReplyEnabled: false,
  maxApplications: null,
  verifiedBadgeEnabled: false,
  featuredProfileEnabled: false,
  searchBoostEnabled: false,
  jobAlertsEnabled: false,
  autoApplyEnabled: false,
  profileBoostEnabled: false,
  directMessageEmployersPerMonth: 0,
  visibilityToggleEnabled: false,
  followEmployersEnabled: false,
  resumeBuilderIncluded: false,
  maxJobPosts: null,
};

const featuresCreateSchema = z.object(
  Object.fromEntries(
    Object.entries(featureFields).map(([key, schema]) => [
      key,
      schema.default(CREATE_DEFAULTS[key]),
    ]),
  ),
);

const featuresUpdateSchema = z.object(featureFields).partial();

// A ₹0 plan must be the free plan and vice versa — otherwise it could never
// be checked out (Stripe subscriptions need a positive amount).
export const createPlanSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.default(''),
    audience: z.enum(['employer', 'candidate']),
    priceInr: priceSchema,
    interval: z.enum(['month', 'one_time']).default('month'),
    annualPriceInr: priceSchema.nullable().default(null),
    features: featuresCreateSchema.default({}),
    isFree: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .refine((value) => value.isFree === (value.priceInr === 0), {
    message: 'Free plans must have a price of 0, and ₹0 plans must be marked as free',
    path: ['isFree'],
  })
  .refine((value) => !(value.interval === 'one_time' && value.annualPriceInr), {
    message: 'One-time plans cannot have an annual price',
    path: ['annualPriceInr'],
  });

// audience is immutable after creation — subscriptions reference it. The
// free/price consistency of the merged document is re-checked in the service.
export const updatePlanSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    priceInr: priceSchema,
    interval: z.enum(['month', 'one_time']),
    annualPriceInr: priceSchema.nullable(),
    features: featuresUpdateSchema,
    isFree: z.boolean(),
    isActive: z.boolean(),
    sortOrder: z.number().int(),
  })
  .partial();
