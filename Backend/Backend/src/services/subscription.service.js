import { env } from '../config/env.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Plan } from '../models/plan.model.js';
import { Subscription } from '../models/subscription.model.js';
import { AppError } from '../utils/app-error.js';
import {
  countActiveFeaturedJobs,
  countActiveJobs,
  countApplicationsInPeriod,
  countDirectMessagesUsed,
  getEmployerContext,
  getEntitlements,
} from './entitlement.service.js';
import { reconcilePendingPurchases } from './purchase.service.js';
import { confirmCheckoutSessionById, syncCandidateTier } from './subscription-sync.service.js';
import { getStripe, syncPlanToStripe } from './stripe.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

const paymentTestModeEnabled = () => env.PAYMENT_TEST_MODE && env.NODE_ENV !== 'production';

export async function getActiveSubscription(userId, role) {
  return Subscription.findOne({
    user: userId,
    audienceRole: role,
    status: { $in: ['active', 'past_due'] },
  })
    .populate('plan')
    .lean();
}

function serializePlan(entitlements) {
  if (!entitlements.plan) {
    return null;
  }

  return {
    _id: String(entitlements.plan._id),
    name: entitlements.plan.name,
    planKey: entitlements.plan.planKey ?? null,
    description: entitlements.plan.description,
    priceInr: entitlements.plan.priceInr,
    annualPriceInr: entitlements.plan.annualPriceInr ?? null,
    interval: entitlements.plan.interval ?? 'month',
    features: entitlements.features,
    isFree: Boolean(entitlements.plan.isFree),
  };
}

export async function getMySubscription(user) {
  const entitlements = await getEntitlements(user, { reconcilePending: true });

  return {
    plan: serializePlan(entitlements),
    isFree: entitlements.isFree,
    status: entitlements.subscription?.status ?? null,
    billingInterval: entitlements.subscription?.billingInterval ?? 'month',
    cancelAtPeriodEnd: entitlements.subscription?.cancelAtPeriodEnd ?? false,
    periodStart: entitlements.periodStart,
    periodEnd: entitlements.periodEnd,
  };
}

export async function getMyUsage(user) {
  await reconcilePendingPurchases(user).catch(() => {});

  const usage = {};
  let entitlements;
  let effectiveFeatures;

  if (user.role === 'employer') {
    const context = await getEmployerContext(user, { reconcilePending: true });
    entitlements = context.entitlements;
    effectiveFeatures = context.effectiveFeatures;

    if (context.employerProfile) {
      const [activeJobs, featuredJobs] = await Promise.all([
        countActiveJobs(context.employerProfile._id),
        countActiveFeaturedJobs(context.employerProfile._id),
      ]);

      usage.activeJobs = { used: activeJobs, limit: entitlements.features.maxActiveJobs ?? null };
      usage.featuredJobs = { used: featuredJobs, limit: effectiveFeatures.featuredJobs ?? 0 };
      usage.jobCredits = { available: context.availableJobCredits };
      usage.unlockCredits = { accountBalance: context.employerProfile.unlockCreditBalance ?? 0 };
    } else {
      usage.activeJobs = { used: 0, limit: entitlements.features.maxActiveJobs ?? null };
      usage.featuredJobs = { used: 0, limit: effectiveFeatures.featuredJobs ?? 0 };
      usage.jobCredits = { available: 0 };
      usage.unlockCredits = { accountBalance: 0 };
    }
  } else {
    entitlements = await getEntitlements(user, { reconcilePending: true });
    effectiveFeatures = entitlements.features;

    const candidateProfile = await CandidateProfile.findOne({ email: user.email })
      .select('_id resumeCreditBalance')
      .lean();

    usage.applications = {
      used: candidateProfile
        ? await countApplicationsInPeriod(candidateProfile._id, entitlements.periodStart)
        : 0,
      limit: entitlements.features.maxApplications ?? null,
    };
    usage.directMessages = {
      used: candidateProfile ? await countDirectMessagesUsed(candidateProfile._id, entitlements) : 0,
      limit: entitlements.features.directMessageEmployersPerMonth ?? 0,
    };
    usage.resumeCredits = { available: candidateProfile?.resumeCreditBalance ?? 0 };
  }

  return {
    plan: entitlements.plan
      ? {
          _id: String(entitlements.plan._id),
          name: entitlements.plan.name,
          planKey: entitlements.plan.planKey ?? null,
          isFree: Boolean(entitlements.plan.isFree),
          features: entitlements.features,
        }
      : null,
    effectiveFeatures,
    status: entitlements.subscription?.status ?? null,
    billingInterval: entitlements.subscription?.billingInterval ?? 'month',
    cancelAtPeriodEnd: entitlements.subscription?.cancelAtPeriodEnd ?? false,
    periodStart: entitlements.periodStart,
    periodEnd: entitlements.periodEnd,
    usage,
  };
}

export async function createCheckoutSession(user, planId, billingInterval = 'month') {
  if (!isObjectId(planId)) {
    throw new AppError('Plan not found', 404);
  }

  const plan = await Plan.findById(planId);

  if (!plan || !plan.isActive) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.audience !== user.role) {
    throw new AppError(`This plan is for ${plan.audience}s only`, 403);
  }

  if (plan.isFree) {
    throw new AppError('The free plan is available to everyone — nothing to buy', 400);
  }

  if (plan.interval === 'one_time') {
    throw new AppError(
      'This plan is bought per use — use the purchase flow instead of a subscription.',
      400,
      undefined,
      'USE_PURCHASE_FLOW',
    );
  }

  if (billingInterval === 'year' && !(plan.annualPriceInr > 0)) {
    throw new AppError('This plan has no annual pricing', 400);
  }

  // Entitlement resolution lazily syncs with Stripe, so a lapsed/canceled
  // subscription correctly frees the user to buy again.
  const entitlements = await getEntitlements(user, { reconcilePending: true });

  if (entitlements.subscription) {
    throw new AppError(
      'You already have an active subscription. Cancel it before choosing a different plan.',
      409,
      undefined,
      'SUBSCRIPTION_EXISTS',
    );
  }

  // Dev/test bypass — mint a local pending subscription and a test session id
  // the confirm endpoint activates without Stripe.
  if (paymentTestModeEnabled()) {
    const pending = await Subscription.findOneAndUpdate(
      { user: user.id, audienceRole: user.role, status: 'incomplete', stripeSubscriptionId: null },
      {
        $set: {
          userEmail: user.email,
          plan: plan._id,
          billingInterval,
          stripeCheckoutSessionId: null,
        },
        $setOnInsert: {
          user: user.id,
          audienceRole: user.role,
          status: 'incomplete',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const sessionId = `test_sub_${pending._id}`;
    pending.stripeCheckoutSessionId = sessionId;
    await pending.save();

    return { url: `${env.FRONTEND_BASE_URL}/billing/success?session_id=${sessionId}` };
  }

  const stripe = await getStripe();

  const priceField = billingInterval === 'year' ? 'stripeAnnualPriceId' : 'stripePriceId';

  if (!plan[priceField]) {
    await syncPlanToStripe(plan);
  }

  if (!plan[priceField]) {
    throw new AppError('This plan is not available for purchase yet', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  // Reuse the Stripe customer from any previous subscription of this user.
  const previous = await Subscription.findOne({
    user: user.id,
    stripeCustomerId: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .select('stripeCustomerId')
    .lean();

  let customerId = previous?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: String(user.id) },
    });
    customerId = customer.id;
  }

  const metadata = {
    userId: String(user.id),
    userEmail: user.email,
    planId: String(plan._id),
    audienceRole: user.role,
    billingInterval,
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: plan[priceField], quantity: 1 }],
    success_url: `${env.FRONTEND_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_BASE_URL}/pricing?canceled=1`,
    metadata,
    subscription_data: { metadata },
  });

  // Pending record so the payment can be reconciled from Stripe even if the
  // user never lands back on the success page (no webhook required).
  await Subscription.findOneAndUpdate(
    { user: user.id, audienceRole: user.role, status: 'incomplete', stripeSubscriptionId: null },
    {
      $set: {
        userEmail: user.email,
        plan: plan._id,
        billingInterval,
        stripeCustomerId: customerId,
        stripeCheckoutSessionId: session.id,
      },
      $setOnInsert: {
        user: user.id,
        audienceRole: user.role,
        status: 'incomplete',
      },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return { url: session.url };
}

/** Activate a `test_sub_` pending subscription without Stripe (dev only). */
async function confirmTestCheckout(user, sessionId) {
  const subscriptionId = String(sessionId).slice('test_sub_'.length);

  if (!isObjectId(subscriptionId)) {
    throw new AppError('Checkout session not found', 404);
  }

  const subscription = await Subscription.findOne({ _id: subscriptionId, user: user.id });

  if (!subscription) {
    throw new AppError('Checkout session not found', 404);
  }

  if (subscription.status !== 'active') {
    const now = new Date();
    const days = subscription.billingInterval === 'year' ? 365 : 30;
    subscription.status = 'active';
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    await subscription.save();

    await Subscription.updateMany(
      {
        _id: { $ne: subscription._id },
        user: subscription.user,
        audienceRole: subscription.audienceRole,
        status: { $in: ['active', 'past_due', 'incomplete'] },
      },
      { $set: { status: 'canceled', canceledAt: now } },
    );

    await syncCandidateTier(subscription);
  }

  return subscription;
}

/**
 * Called from the success page: verify the checkout session with Stripe
 * (secret key only — no webhook) and activate the subscription immediately.
 */
export async function confirmMyCheckout(user, sessionId) {
  let subscription;

  if (paymentTestModeEnabled() && String(sessionId).startsWith('test_sub_')) {
    subscription = await confirmTestCheckout(user, sessionId);
  } else {
    subscription = await confirmCheckoutSessionById(sessionId, user.id);
  }

  if (!subscription) {
    throw new AppError('Could not confirm this payment yet. Please refresh in a moment.', 409);
  }

  return getMySubscription(user);
}

export async function cancelMySubscription(user) {
  const subscription = await Subscription.findOne({
    user: user.id,
    audienceRole: user.role,
    status: { $in: ['active', 'past_due'] },
  });

  if (!subscription) {
    throw new AppError('You do not have an active subscription to cancel', 404);
  }

  if (subscription.stripeSubscriptionId) {
    const stripe = await getStripe();
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  subscription.cancelAtPeriodEnd = true;
  await subscription.save();

  return {
    cancelAtPeriodEnd: true,
    periodEnd: subscription.currentPeriodEnd,
  };
}

export async function listSubscriptionsAdmin(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const filters = {};

  if (query.status) {
    filters.status = String(query.status).trim();
  }

  if (query.audience === 'employer' || query.audience === 'candidate') {
    filters.audienceRole = query.audience;
  }

  if (query.search) {
    filters.userEmail = new RegExp(String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const [items, total] = await Promise.all([
    Subscription.find(filters)
      .populate('plan', 'name priceInr audience planKey')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Subscription.countDocuments(filters),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

/**
 * Admin grant: activate a plan for a user locally (no Stripe) for `days`
 * days. Used for comped accounts and manual tier-by-tier testing.
 */
export async function grantSubscriptionAdmin({ userEmail, planId, days = 30 }) {
  if (!isObjectId(planId)) {
    throw new AppError('Plan not found', 404);
  }

  const plan = await Plan.findById(planId).lean();

  if (!plan || plan.isFree) {
    throw new AppError('Grant requires an existing paid plan', 400);
  }

  if (plan.interval === 'one_time') {
    throw new AppError('Pay-per-use plans cannot be granted as subscriptions', 400);
  }

  const { User } = await import('../models/user.model.js');
  const user = await User.findOne({ email: String(userEmail).toLowerCase() }).select('_id email role').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role !== plan.audience) {
    throw new AppError(`This plan is for ${plan.audience}s, but the user is a ${user.role}`, 400);
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000);

  await Subscription.updateMany(
    {
      user: user._id,
      audienceRole: plan.audience,
      status: { $in: ['active', 'past_due', 'incomplete'] },
    },
    { $set: { status: 'canceled', canceledAt: now } },
  );

  const subscription = await Subscription.create({
    user: user._id,
    userEmail: user.email,
    plan: plan._id,
    audienceRole: plan.audience,
    status: 'active',
    billingInterval: 'month',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });

  await syncCandidateTier(subscription);

  return subscription.toObject();
}
