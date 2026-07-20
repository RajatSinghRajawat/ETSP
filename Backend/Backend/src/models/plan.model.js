import mongoose from 'mongoose';

/**
 * A subscription plan configured by the admin. Plans are audience-specific:
 * employer plans gate job posting, candidate plans gate job applications.
 * `null` limits mean unlimited. Exactly one free plan may exist per audience
 * (enforced by a partial unique index) — plan-less users inherit its features.
 *
 * `interval: 'one_time'` marks a pay-per-use plan (e.g. Pay Per Job): it is
 * shown on the pricing page but bought through the one-time Purchase flow,
 * never as a recurring Stripe subscription.
 */
const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    audience: {
      type: String,
      enum: ['employer', 'candidate'],
      required: true,
    },
    // Stable machine key for the well-known seeded plans; admin-created extras
    // have none. Lets services look plans up without matching on names.
    // Uniqueness enforced by a partial index below — a sparse unique index
    // would still collide on the explicit nulls admin-created plans store.
    planKey: { type: String, default: null },
    priceInr: { type: Number, required: true, min: 0 },
    interval: { type: String, enum: ['month', 'one_time'], default: 'month' },
    // Optional yearly price for month-interval plans (e.g. Premium ₹9999/yr).
    annualPriceInr: { type: Number, min: 0, default: null },
    features: {
      // ---- shared ----
      aiEnabled: { type: Boolean, default: false },
      // ---- employer ----
      // Concurrent active (non-expired) job posts. null = unlimited.
      maxActiveJobs: { type: Number, min: 0, default: null },
      // Days a job stays live after posting. null = never expires.
      jobValidityDays: { type: Number, min: 1, default: null },
      // Concurrent featured jobs allowed.
      featuredJobs: { type: Number, min: 0, default: 0 },
      searchFiltersEnabled: { type: Boolean, default: false },
      chatEnabled: { type: Boolean, default: false },
      screeningQuestionsEnabled: { type: Boolean, default: false },
      // Profile-unlock credits granted per posted job.
      unlockCreditsPerJob: { type: Number, min: 0, default: 0 },
      // How many EXCEL-member applicant profiles are visible per job without
      // spending credits. null = all EXCEL applicants visible.
      visibleExcelProfilesPerJob: { type: Number, min: 0, default: null },
      dedicatedAccountManager: { type: Boolean, default: false },
      // May buy the ₹199 → +20 unlock-credits add-on.
      creditAddonsEnabled: { type: Boolean, default: false },
      // May buy single CV unlocks (₹25 / 3 for ₹75) — free employer trial.
      perCvUnlockEnabled: { type: Boolean, default: false },
      // Employer AI auto-acknowledgment in chat when a candidate applies.
      autoReplyEnabled: { type: Boolean, default: false },
      // ---- candidate ----
      // Applications allowed per billing period. null = unlimited.
      maxApplications: { type: Number, min: 0, default: null },
      verifiedBadgeEnabled: { type: Boolean, default: false },
      featuredProfileEnabled: { type: Boolean, default: false },
      searchBoostEnabled: { type: Boolean, default: false },
      jobAlertsEnabled: { type: Boolean, default: false },
      autoApplyEnabled: { type: Boolean, default: false },
      profileBoostEnabled: { type: Boolean, default: false },
      // Distinct employers the candidate may start conversations with per month.
      directMessageEmployersPerMonth: { type: Number, min: 0, default: 0 },
      // May hide their profile from employer search (free profiles stay open).
      visibilityToggleEnabled: { type: Boolean, default: false },
      followEmployersEnabled: { type: Boolean, default: false },
      resumeBuilderIncluded: { type: Boolean, default: false },
      // ---- legacy (no longer read for gating; kept so old docs validate) ----
      maxJobPosts: { type: Number, min: 0, default: null },
    },
    isFree: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    stripeProductId: { type: String, default: null },
    stripePriceId: { type: String, default: null },
    stripeAnnualPriceId: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

planSchema.index({ audience: 1, isActive: 1, sortOrder: 1 });
planSchema.index(
  { planKey: 1 },
  { unique: true, partialFilterExpression: { planKey: { $type: 'string' } } },
);
planSchema.index(
  { audience: 1 },
  {
    name: 'unique_free_plan_per_audience',
    unique: true,
    partialFilterExpression: { isFree: true },
  },
);

export const Plan = mongoose.model('Plan', planSchema);
