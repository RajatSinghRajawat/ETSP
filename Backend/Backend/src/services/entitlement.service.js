import { CandidateOutreach } from '../models/candidate-outreach.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/job-application.model.js';
import { JobCredit } from '../models/job-credit.model.js';
import { Plan } from '../models/plan.model.js';
import { Subscription } from '../models/subscription.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { getFreePlan } from './plan.service.js';
import {
  reconcilePendingSubscription,
  refreshSubscriptionFromStripe,
} from './subscription-sync.service.js';

/**
 * Canonical feature shape. Every gate reads normalized features only, so
 * legacy plan documents (pre feature-matrix) and admin-created plans missing
 * keys resolve to safe fail-closed values.
 */
const FEATURE_DEFAULTS = {
  aiEnabled: false,
  // employer
  maxActiveJobs: 0,
  jobValidityDays: null,
  featuredJobs: 0,
  searchFiltersEnabled: false,
  chatEnabled: false,
  screeningQuestionsEnabled: false,
  unlockCreditsPerJob: 0,
  visibleExcelProfilesPerJob: 0,
  dedicatedAccountManager: false,
  creditAddonsEnabled: false,
  perCvUnlockEnabled: false,
  autoReplyEnabled: false,
  // candidate
  maxApplications: 0,
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
};

// Users without any plan (no free plan seeded yet) get nothing — fail closed.
const LOCKED_FEATURES = { ...FEATURE_DEFAULTS };

/**
 * Fill the canonical shape from a plan document's features. Legacy fallbacks:
 * the old `maxJobPosts` maps onto `maxActiveJobs`, and candidate plans that
 * used the shared `autoReplyEnabled` flag for auto-apply keep working.
 */
export function normalizeFeatures(plan) {
  const raw = plan?.features ?? {};
  const features = { ...FEATURE_DEFAULTS };

  for (const key of Object.keys(FEATURE_DEFAULTS)) {
    if (raw[key] !== undefined && raw[key] !== null) {
      features[key] = raw[key];
    } else if (raw[key] === null && (key === 'maxActiveJobs' || key === 'maxApplications' || key === 'jobValidityDays' || key === 'visibleExcelProfilesPerJob')) {
      features[key] = null; // explicit null = unlimited / not applicable
    }
  }

  if (raw.maxActiveJobs === undefined && raw.maxJobPosts !== undefined) {
    features.maxActiveJobs = raw.maxJobPosts;
  }

  if (plan?.audience === 'candidate' && raw.autoApplyEnabled === undefined && raw.autoReplyEnabled) {
    features.autoApplyEnabled = true;
  }

  return features;
}

/** Calendar-month billing period (UTC) used for free-plan users. */
export function getCalendarMonthPeriod(now = new Date()) {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { periodStart, periodEnd };
}

// Throttle for lazy Stripe refreshes of lapsed subscriptions — bounds Stripe
// API calls when a subscription lingers in a lapsed state.
const refreshAttempts = new Map();
const REFRESH_THROTTLE_MS = 60_000;

const isPeriodLapsed = (subscription) =>
  Boolean(subscription?.currentPeriodEnd) && new Date(subscription.currentPeriodEnd) < new Date();

async function findLiveSubscription(userId, role) {
  return Subscription.findOne({
    user: userId,
    audienceRole: role,
    status: { $in: ['active', 'past_due'] },
  })
    .populate('plan')
    .lean();
}

/**
 * Resolve what a user is entitled to right now:
 * active paid subscription's plan → free plan of their role → locked defaults.
 *
 * Works without Stripe webhooks: when the locally stored billing period has
 * lapsed, the subscription is re-pulled from the Stripe API — a renewal
 * advances the period, a cancellation/failed payment downgrades to free. A
 * subscription that stays lapsed is NOT honored (fail closed). Admin-granted
 * subscriptions (no Stripe id) are honored until their period end.
 *
 * `options.reconcilePending` additionally checks Stripe for a paid-but-never-
 * confirmed checkout (used by the subscription/usage endpoints).
 */
export async function getEntitlements(user, options = {}) {
  if (!user?.id || !user?.role) {
    throw new AppError('Authentication required', 401);
  }

  let subscription = await findLiveSubscription(user.id, user.role);

  if (subscription && isPeriodLapsed(subscription)) {
    if (subscription.stripeSubscriptionId) {
      const throttleKey = String(subscription._id);
      const lastAttempt = refreshAttempts.get(throttleKey) ?? 0;

      if (Date.now() - lastAttempt > REFRESH_THROTTLE_MS) {
        refreshAttempts.set(throttleKey, Date.now());
        await refreshSubscriptionFromStripe(subscription);
        subscription = await findLiveSubscription(user.id, user.role);
      }
    } else {
      // Admin-granted subscription past its end date — retire it locally.
      await Subscription.updateOne(
        { _id: subscription._id },
        { $set: { status: 'canceled', canceledAt: new Date() } },
      );
      subscription = null;
    }

    // Still lapsed after (or between) refreshes → no paid entitlements.
    if (subscription && isPeriodLapsed(subscription)) {
      subscription = null;
    }
  }

  if (!subscription && options.reconcilePending) {
    const pending = await Subscription.findOne({
      user: user.id,
      audienceRole: user.role,
      status: 'incomplete',
      stripeCheckoutSessionId: { $ne: null },
    }).sort({ createdAt: -1 });

    if (pending && Date.now() - new Date(pending.createdAt).getTime() < 24 * 60 * 60 * 1000) {
      await reconcilePendingSubscription(pending);
      subscription = await findLiveSubscription(user.id, user.role);
    }
  }

  if (subscription?.plan) {
    const { periodStart, periodEnd } =
      subscription.currentPeriodStart && subscription.currentPeriodEnd
        ? { periodStart: subscription.currentPeriodStart, periodEnd: subscription.currentPeriodEnd }
        : getCalendarMonthPeriod();

    return {
      plan: subscription.plan,
      planName: subscription.plan.name,
      isFree: false,
      features: normalizeFeatures(subscription.plan),
      periodStart,
      periodEnd,
      subscription,
    };
  }

  const freePlan = await getFreePlan(user.role);

  if (freePlan) {
    const { periodStart, periodEnd } = getCalendarMonthPeriod();

    return {
      plan: freePlan,
      planName: freePlan.name,
      isFree: true,
      features: normalizeFeatures(freePlan),
      periodStart,
      periodEnd,
      subscription: null,
    };
  }

  logger.warn('No free plan configured — user entitlements are locked', { role: user.role });

  const { periodStart, periodEnd } = getCalendarMonthPeriod();

  return {
    plan: null,
    planName: null,
    isFree: true,
    features: LOCKED_FEATURES,
    periodStart,
    periodEnd,
    subscription: null,
  };
}

/** Entitlements for a user known only by email (used by chat auto-reply). */
export async function getEntitlementsByEmail(email, role) {
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('_id').lean();

  if (!user) {
    return null;
  }

  return getEntitlements({ id: String(user._id), email, role });
}

/** Period key for candidate quota ledgers ('YYYY-MM' or period-start ISO). */
export function getCandidatePeriodKey(entitlements) {
  if (entitlements.subscription?.currentPeriodStart) {
    return new Date(entitlements.subscription.currentPeriodStart).toISOString();
  }

  return new Date(entitlements.periodStart).toISOString().slice(0, 7);
}

const ACTIVE_JOB_FILTER = () => ({
  status: 'active',
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

/** Concurrent active non-expired jobs counted against the base plan. */
export async function countActiveJobs(employerProfileId) {
  return Job.countDocuments({
    employerProfile: employerProfileId,
    postedVia: { $ne: 'pay_per_job' },
    ...ACTIVE_JOB_FILTER(),
  });
}

export async function countActiveFeaturedJobs(employerProfileId) {
  return Job.countDocuments({
    employerProfile: employerProfileId,
    isFeatured: true,
    ...ACTIVE_JOB_FILTER(),
  });
}

export async function countApplicationsInPeriod(candidateProfileId, periodStart) {
  return JobApplication.countDocuments({
    candidateProfile: candidateProfileId,
    createdAt: { $gte: periodStart },
  });
}

export async function getPayPerJobPlan() {
  return Plan.findOne({ planKey: 'employer_pay_per_job', isActive: true }).lean();
}

/**
 * Employer entitlement context: base plan features plus the "pay-per-job
 * context" — an employer holding an unused job credit or running a live
 * pay-per-job post gets that plan's boolean features (chat, filters,
 * screening, add-ons) OR-merged in, and sees all EXCEL applicants.
 */
export async function getEmployerContext(user, options = {}) {
  const entitlements = await getEntitlements(user, options);
  const employerProfile = await EmployerProfile.findOne({ email: user.email })
    .select('_id email companyName unlockCreditBalance')
    .lean();

  let availableJobCredits = 0;
  let hasPpjContext = false;
  const effectiveFeatures = { ...entitlements.features };

  if (employerProfile) {
    availableJobCredits = await JobCredit.countDocuments({
      employerProfile: employerProfile._id,
      status: 'available',
    });

    hasPpjContext =
      availableJobCredits > 0 ||
      Boolean(
        await Job.exists({
          employerProfile: employerProfile._id,
          postedVia: 'pay_per_job',
          ...ACTIVE_JOB_FILTER(),
        }),
      );

    if (entitlements.isFree && hasPpjContext) {
      const ppjPlan = await getPayPerJobPlan();

      if (ppjPlan) {
        const ppjFeatures = normalizeFeatures(ppjPlan);
        for (const key of [
          'searchFiltersEnabled',
          'chatEnabled',
          'screeningQuestionsEnabled',
          'creditAddonsEnabled',
        ]) {
          effectiveFeatures[key] = effectiveFeatures[key] || ppjFeatures[key];
        }
        // Pay-per-job employers see every EXCEL applicant, not just the free 5.
        effectiveFeatures.visibleExcelProfilesPerJob = null;
      }
    }
  }

  return {
    entitlements,
    employerProfile,
    availableJobCredits,
    hasPpjContext,
    effectiveFeatures,
  };
}

/**
 * Gate for posting (or reactivating) a job. Returns the entitlements plus the
 * `jobSetup` to stamp on the job: postedVia, expiry, unlock pool, credit.
 *
 * `useJobCredit` consumes a purchased Pay Per Job credit instead of the base
 * plan's concurrent slot. The credit itself is marked consumed by the caller
 * AFTER the job is created (consumeJobCredit) so a failed create keeps it.
 */
export async function assertCanPostJob(user, employerProfileId, options = {}) {
  const { useJobCredit = false, wantsFeatured = false, hasScreeningQuestions = false, excludeJobId = null } = options;
  const context = await getEmployerContext(user);
  const { entitlements, effectiveFeatures } = context;
  const now = new Date();

  let jobSetup;

  if (useJobCredit) {
    const credit = await JobCredit.findOne({
      employerProfile: employerProfileId,
      status: 'available',
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!credit) {
      throw new AppError(
        'You have no Pay Per Job credits. Buy one to post this job.',
        402,
        { canBuyCredit: true },
        'NO_JOB_CREDIT',
      );
    }

    jobSetup = {
      postedVia: 'pay_per_job',
      jobCreditId: credit._id,
      expiresAt: new Date(now.getTime() + credit.validityDays * 24 * 60 * 60 * 1000),
      unlockCreditsTotal: credit.unlockCreditsPerJob,
    };
  } else {
    const limit = entitlements.features.maxActiveJobs;

    if (limit !== null && limit !== undefined) {
      const query = {
        employerProfile: employerProfileId,
        postedVia: { $ne: 'pay_per_job' },
        ...ACTIVE_JOB_FILTER(),
      };
      if (excludeJobId) {
        query._id = { $ne: excludeJobId };
      }
      const used = await Job.countDocuments(query);

      if (used >= limit) {
        throw new AppError(
          `You have reached your plan's active job limit (${limit}). Close a job, buy a Pay Per Job credit, or upgrade your plan.`,
          403,
          { used, limit, canUseCredit: context.availableJobCredits > 0 },
          'PLAN_LIMIT_REACHED',
        );
      }
    }

    const validityDays = entitlements.features.jobValidityDays;

    jobSetup = {
      postedVia: entitlements.isFree ? 'free' : 'premium',
      jobCreditId: null,
      expiresAt: validityDays ? new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000) : null,
      unlockCreditsTotal: entitlements.features.unlockCreditsPerJob ?? 0,
    };
  }

  if (wantsFeatured) {
    const featuredLimit = effectiveFeatures.featuredJobs ?? 0;

    if (featuredLimit <= 0) {
      throw new AppError(
        'Featured jobs are not included in your current plan. Upgrade to Premium to feature a job.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }

    const featuredQuery = { employerProfile: employerProfileId, isFeatured: true, ...ACTIVE_JOB_FILTER() };
    if (excludeJobId) {
      featuredQuery._id = { $ne: excludeJobId };
    }
    const featuredUsed = await Job.countDocuments(featuredQuery);

    if (featuredUsed >= featuredLimit) {
      throw new AppError(
        `You have reached your plan's featured job limit (${featuredLimit}). Unfeature another job first.`,
        403,
        { used: featuredUsed, limit: featuredLimit },
        'PLAN_LIMIT_REACHED',
      );
    }
  }

  if (hasScreeningQuestions && !effectiveFeatures.screeningQuestionsEnabled) {
    throw new AppError(
      'Screening questions are not included in your current plan. Upgrade to add them.',
      403,
      undefined,
      'FEATURE_NOT_IN_PLAN',
    );
  }

  return { ...context, jobSetup };
}

/** Mark a Pay Per Job credit consumed by a created job (call after create). */
export async function consumeJobCredit(jobCreditId, jobId) {
  await JobCredit.updateOne(
    { _id: jobCreditId, status: 'available' },
    { $set: { status: 'consumed', consumedByJob: jobId, consumedAt: new Date() } },
  );
}

export async function assertCanApply(user, candidateProfileId) {
  const entitlements = await getEntitlements(user);
  const limit = entitlements.features.maxApplications;

  if (limit === null || limit === undefined) {
    return entitlements;
  }

  const used = await countApplicationsInPeriod(candidateProfileId, entitlements.periodStart);

  if (used >= limit) {
    throw new AppError(
      `You have reached your plan's application limit (${limit} this period). Upgrade your plan to apply to more jobs.`,
      403,
      { used, limit },
      'PLAN_LIMIT_REACHED',
    );
  }

  return entitlements;
}

export async function assertAiEnabled(user) {
  const entitlements = await getEntitlements(user);

  if (!entitlements.features.aiEnabled) {
    throw new AppError(
      'AI features are not included in your current plan. Upgrade to unlock them.',
      403,
      undefined,
      'FEATURE_NOT_IN_PLAN',
    );
  }

  return entitlements;
}

/**
 * Gate for a candidate starting a conversation with an employer they haven't
 * messaged this period. Free plan → not included; EXCEL → 3 distinct
 * employers per month. Returns the ledger key so the caller can record the
 * outreach after the message actually sends.
 */
export async function assertCanDirectMessage(user, candidateProfileId, employerProfileId) {
  const entitlements = await getEntitlements(user);
  const limit = entitlements.features.directMessageEmployersPerMonth ?? 0;

  if (limit <= 0) {
    throw new AppError(
      'Direct messaging to employers is available on the EXCEL plan. Upgrade to start conversations.',
      403,
      undefined,
      'FEATURE_NOT_IN_PLAN',
    );
  }

  const periodKey = getCandidatePeriodKey(entitlements);

  const existing = await CandidateOutreach.findOne({
    candidateProfile: candidateProfileId,
    employerProfile: employerProfileId,
    periodKey,
  })
    .select('_id')
    .lean();

  if (existing) {
    return { entitlements, periodKey, counted: false };
  }

  const used = await CandidateOutreach.countDocuments({
    candidateProfile: candidateProfileId,
    periodKey,
  });

  if (used >= limit) {
    throw new AppError(
      `You have reached your plan's direct messaging limit (${limit} employers this month).`,
      403,
      { used, limit },
      'PLAN_LIMIT_REACHED',
    );
  }

  return { entitlements, periodKey, counted: true };
}

/** Record a counted outreach (idempotent — duplicate inserts are swallowed). */
export async function recordCandidateOutreach(candidateProfileId, employerProfileId, periodKey) {
  try {
    await CandidateOutreach.create({
      candidateProfile: candidateProfileId,
      employerProfile: employerProfileId,
      periodKey,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
}

export async function countDirectMessagesUsed(candidateProfileId, entitlements) {
  const periodKey = getCandidatePeriodKey(entitlements);
  return CandidateOutreach.countDocuments({ candidateProfile: candidateProfileId, periodKey });
}
