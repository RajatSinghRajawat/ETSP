import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { Plan } from '../src/models/plan.model.js';
import { Subscription } from '../src/models/subscription.model.js';
import { logger } from '../src/utils/logger.js';

/**
 * Seed the five subscription plans from subscriptions.xlsx. Idempotent:
 * plans are matched by planKey; an existing free plan per audience is adopted
 * (planKey stamped on) so the one-free-plan-per-audience index never trips.
 * Run: npm run seed:plans
 */

const PLANS = [
  {
    planKey: 'employer_free',
    name: 'Free',
    audience: 'employer',
    priceInr: 0,
    annualPriceInr: null,
    interval: 'month',
    isFree: true,
    isActive: true,
    sortOrder: 0,
    description:
      '2 active job posts with 3-day validity. See 5 EXCEL applicant profiles per job (others stay locked). Helpline support included. Buy CV unlocks @₹25 (or 3 for ₹75) and the Urgent Hiring tag @₹199.',
    features: {
      aiEnabled: false,
      maxActiveJobs: 2,
      jobValidityDays: 3,
      featuredJobs: 0,
      searchFiltersEnabled: false,
      chatEnabled: false,
      screeningQuestionsEnabled: false,
      unlockCreditsPerJob: 0,
      visibleExcelProfilesPerJob: 5,
      dedicatedAccountManager: false,
      creditAddonsEnabled: false,
      perCvUnlockEnabled: true,
      autoReplyEnabled: false,
    },
  },
  {
    planKey: 'employer_pay_per_job',
    name: 'Pay Per Job',
    audience: 'employer',
    priceInr: 499,
    annualPriceInr: null,
    interval: 'one_time',
    isFree: false,
    isActive: true,
    sortOrder: 1,
    description:
      'One-time ₹499 per job post. 14-day validity, 15 profile unlock credits for that job, all EXCEL applicants visible, screening filters, chat with candidates and screening questions. Helpline support included.',
    features: {
      aiEnabled: false,
      maxActiveJobs: 0,
      jobValidityDays: 14,
      featuredJobs: 0,
      searchFiltersEnabled: true,
      chatEnabled: true,
      screeningQuestionsEnabled: true,
      unlockCreditsPerJob: 15,
      visibleExcelProfilesPerJob: null,
      dedicatedAccountManager: false,
      creditAddonsEnabled: true,
      perCvUnlockEnabled: false,
      autoReplyEnabled: false,
    },
  },
  {
    planKey: 'employer_premium',
    name: 'Premium',
    audience: 'employer',
    priceInr: 999,
    annualPriceInr: 9999,
    interval: 'month',
    isFree: false,
    isActive: true,
    sortOrder: 2,
    description:
      '₹999/month or ₹9999/year. 3 active jobs with 30-day validity, 1 featured job, AI assistance, 50 unlock credits per job, all EXCEL applicants visible, screening filters & questions, chat, and a dedicated account manager.',
    features: {
      aiEnabled: true,
      maxActiveJobs: 3,
      jobValidityDays: 30,
      featuredJobs: 1,
      searchFiltersEnabled: true,
      chatEnabled: true,
      screeningQuestionsEnabled: true,
      unlockCreditsPerJob: 50,
      visibleExcelProfilesPerJob: null,
      dedicatedAccountManager: true,
      creditAddonsEnabled: true,
      perCvUnlockEnabled: false,
      autoReplyEnabled: true,
    },
  },
  {
    planKey: 'candidate_free',
    name: 'Free',
    audience: 'candidate',
    priceInr: 0,
    annualPriceInr: null,
    interval: 'month',
    isFree: true,
    isActive: true,
    sortOrder: 0,
    description:
      'Apply to jobs with your profile open to recruiters. Build your resume @₹25 per resume.',
    features: {
      aiEnabled: false,
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
    },
  },
  {
    planKey: 'candidate_excel',
    name: 'EXCEL',
    audience: 'candidate',
    priceInr: 199,
    annualPriceInr: null,
    interval: 'month',
    isFree: false,
    isActive: true,
    sortOrder: 1,
    description:
      '₹199/month. Verified badge, featured profile, appear higher in search results, job alert emails, AI auto-apply, profile boosting, direct messaging to 3 employers/month, follow employers, choose profile visibility, resume builder included.',
    features: {
      aiEnabled: true,
      maxApplications: null,
      verifiedBadgeEnabled: true,
      featuredProfileEnabled: true,
      searchBoostEnabled: true,
      jobAlertsEnabled: true,
      autoApplyEnabled: true,
      profileBoostEnabled: true,
      directMessageEmployersPerMonth: 3,
      visibilityToggleEnabled: true,
      followEmployersEnabled: true,
      resumeBuilderIncluded: true,
    },
  },
];

async function upsertPlan(definition) {
  let plan = await Plan.findOne({ planKey: definition.planKey });

  // Adopt a pre-existing free plan of the same audience (partial unique index
  // allows only one) instead of failing to insert a second one.
  if (!plan && definition.isFree) {
    plan = await Plan.findOne({ audience: definition.audience, isFree: true });
  }

  if (plan) {
    plan.set({ ...definition });
    for (const [key, value] of Object.entries(definition.features)) {
      plan.set(`features.${key}`, value);
    }
    await plan.save();
    logger.info(`Updated plan: ${definition.planKey}`);
  } else {
    await Plan.create(definition);
    logger.info(`Created plan: ${definition.planKey}`);
  }
}

/** Backfill the denormalized EXCEL tier for already-active candidate subs. */
async function backfillCandidateTiers() {
  const excelPlan = await Plan.findOne({ planKey: 'candidate_excel' }).select('_id').lean();

  if (!excelPlan) {
    return;
  }

  const activeSubs = await Subscription.find({
    plan: excelPlan._id,
    status: { $in: ['active', 'past_due'] },
  })
    .select('userEmail currentPeriodEnd')
    .lean();

  for (const sub of activeSubs) {
    await CandidateProfile.updateOne(
      { email: sub.userEmail },
      {
        $set: {
          subscriptionTier: 'excel',
          subscriptionExpiresAt: sub.currentPeriodEnd ?? null,
          searchBoost: 100,
        },
      },
    );
  }

  if (activeSubs.length) {
    logger.info(`Backfilled EXCEL tier for ${activeSubs.length} candidate(s)`);
  }
}

/**
 * Hide stray admin-created plans that are not part of the xlsx catalog from
 * the pricing page. Existing subscribers keep their entitlements — the plan
 * document stays, it just can't be bought anymore.
 */
async function deactivateNonCatalogPlans() {
  const result = await Plan.updateMany(
    { planKey: null, isActive: true },
    { $set: { isActive: false } },
  );

  if (result.modifiedCount > 0) {
    logger.info(`Deactivated ${result.modifiedCount} non-catalog plan(s)`);
  }
}

async function run() {
  await connectDatabase();

  for (const definition of PLANS) {
    await upsertPlan(definition);
  }

  await deactivateNonCatalogPlans();
  await backfillCandidateTiers();

  await disconnectDatabase();
  logger.info('Plan seeding complete. Sync paid plans to Stripe from the admin panel when keys are configured.');
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
