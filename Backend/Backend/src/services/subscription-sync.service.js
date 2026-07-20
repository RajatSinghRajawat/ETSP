import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Plan } from '../models/plan.model.js';
import { Subscription } from '../models/subscription.model.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { getStripe } from './stripe.service.js';

/**
 * Webhook-free Stripe synchronisation. Local subscription state is pulled
 * from the Stripe API (secret key only) at three moments:
 *  1. explicit confirmation when the user lands on the success page,
 *  2. lazy reconciliation of pending (incomplete) checkouts on entitlement reads,
 *  3. lazy refresh of active subscriptions whose local period has lapsed
 *     (renewal advances the period; cancellation/failed payment downgrades).
 * The Stripe webhook endpoint still works if configured, but nothing requires it.
 */

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

const toDate = (epochSeconds) => (epochSeconds ? new Date(epochSeconds * 1000) : null);

// Stripe subscription statuses collapsed onto our four local states.
const STRIPE_STATUS_MAP = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled',
  paused: 'past_due',
};

/**
 * Upsert local state from a Stripe subscription object. Idempotent — repeated
 * or out-of-order syncs converge on Stripe's latest state.
 */
export async function applyStripeSubscriptionState(stripeSubscription) {
  const metadata = stripeSubscription.metadata ?? {};
  const status = STRIPE_STATUS_MAP[stripeSubscription.status] ?? 'incomplete';

  // Period fields moved onto items in newer Stripe API versions.
  const item = stripeSubscription.items?.data?.[0];
  const periodStart = stripeSubscription.current_period_start ?? item?.current_period_start;
  const periodEnd = stripeSubscription.current_period_end ?? item?.current_period_end;

  let subscription = await Subscription.findOne({
    stripeSubscriptionId: stripeSubscription.id,
  });

  if (!subscription && isObjectId(metadata.userId)) {
    // A pending checkout record may exist without the Stripe subscription id yet.
    subscription = await Subscription.findOne({
      user: metadata.userId,
      audienceRole: metadata.audienceRole === 'employer' ? 'employer' : 'candidate',
      status: 'incomplete',
      stripeSubscriptionId: null,
    }).sort({ createdAt: -1 });
  }

  if (!subscription) {
    if (!isObjectId(metadata.userId) || !isObjectId(metadata.planId)) {
      logger.warn('Stripe subscription without usable metadata — skipping', {
        stripeSubscriptionId: stripeSubscription.id,
      });
      return null;
    }

    const user = await User.findById(metadata.userId).select('_id email').lean();

    if (!user) {
      logger.warn('Stripe subscription references unknown user — skipping', {
        stripeSubscriptionId: stripeSubscription.id,
      });
      return null;
    }

    subscription = new Subscription({
      user: user._id,
      userEmail: user.email,
      plan: metadata.planId,
      audienceRole: metadata.audienceRole === 'employer' ? 'employer' : 'candidate',
    });
  }

  if (isObjectId(metadata.planId)) {
    subscription.plan = metadata.planId;
  }

  subscription.stripeSubscriptionId = stripeSubscription.id;
  subscription.stripeCustomerId =
    typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id ?? subscription.stripeCustomerId;
  subscription.status = status;
  subscription.currentPeriodStart = toDate(periodStart) ?? subscription.currentPeriodStart;
  subscription.currentPeriodEnd = toDate(periodEnd) ?? subscription.currentPeriodEnd;
  subscription.cancelAtPeriodEnd = Boolean(stripeSubscription.cancel_at_period_end);

  if (status === 'canceled' && !subscription.canceledAt) {
    subscription.canceledAt = toDate(stripeSubscription.canceled_at) ?? new Date();
  }

  await subscription.save();

  // Single-active invariant: activating this subscription retires any other
  // live subscription for the same user+role.
  if (status === 'active') {
    await Subscription.updateMany(
      {
        _id: { $ne: subscription._id },
        user: subscription.user,
        audienceRole: subscription.audienceRole,
        status: { $in: ['active', 'past_due', 'incomplete'] },
      },
      { $set: { status: 'canceled', canceledAt: new Date() } },
    );
  }

  await syncCandidateTier(subscription);

  return subscription;
}

/**
 * Denormalize the candidate's membership tier onto their profile so
 * employer-facing queries (masking, search ranking) never need a join.
 * Active EXCEL-grade plan → tier 'excel' + search boost; anything else →
 * back to free (with the profile forced visible again).
 */
export async function syncCandidateTier(subscription) {
  if (subscription.audienceRole !== 'candidate') {
    return;
  }

  try {
    const plan = await Plan.findById(subscription.plan)
      .select('planKey features audience')
      .lean();

    const isExcelGrade =
      plan?.audience === 'candidate' &&
      (plan.planKey === 'candidate_excel' || plan.features?.searchBoostEnabled);

    const isLive =
      ['active', 'past_due'].includes(subscription.status) &&
      (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date());

    if (isExcelGrade && isLive) {
      await CandidateProfile.updateOne(
        { email: subscription.userEmail },
        {
          $set: {
            subscriptionTier: 'excel',
            subscriptionExpiresAt: subscription.currentPeriodEnd ?? null,
            searchBoost: 100,
          },
        },
      );
    } else {
      await CandidateProfile.updateOne(
        { email: subscription.userEmail, subscriptionTier: 'excel' },
        {
          $set: {
            subscriptionTier: 'free',
            subscriptionExpiresAt: null,
            searchBoost: 0,
            profileVisible: true,
          },
        },
      );
    }
  } catch (error) {
    logger.warn('Candidate tier sync failed', { message: error.message });
  }
}

/**
 * Verify a completed Checkout session directly with Stripe and activate the
 * subscription. `expectedUserId` guards against confirming someone else's
 * session — the session's metadata must reference the calling user.
 */
export async function confirmCheckoutSessionById(sessionId, expectedUserId) {
  const stripe = await getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);

  if (!session) {
    throw new AppError('Checkout session not found', 404);
  }

  if (expectedUserId && session.metadata?.userId !== String(expectedUserId)) {
    throw new AppError('This checkout session does not belong to your account', 403);
  }

  if (session.mode !== 'subscription' || !session.subscription) {
    throw new AppError('This checkout session has no subscription attached', 400);
  }

  if (session.status !== 'complete' || session.payment_status === 'unpaid') {
    throw new AppError('Payment has not been completed for this checkout session', 402);
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
  );

  // Checkout metadata is the authoritative link back to our user/plan.
  stripeSubscription.metadata = { ...session.metadata, ...stripeSubscription.metadata };

  return applyStripeSubscriptionState(stripeSubscription);
}

/**
 * Re-pull an active/past_due subscription whose local period has lapsed.
 * Returns the updated document; on Stripe/API failure the subscription is
 * treated as expired (fail closed) and left untouched for the next attempt.
 */
export async function refreshSubscriptionFromStripe(subscriptionDoc) {
  if (!subscriptionDoc?.stripeSubscriptionId) {
    return null;
  }

  try {
    const stripe = await getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscriptionDoc.stripeSubscriptionId,
    );

    return await applyStripeSubscriptionState(stripeSubscription);
  } catch (error) {
    logger.warn('Stripe subscription refresh failed — treating as expired until next check', {
      stripeSubscriptionId: subscriptionDoc.stripeSubscriptionId,
      message: error.message,
    });
    return null;
  }
}

/**
 * Reconcile a pending checkout (user paid but never reached the success
 * page). Looks the session up at Stripe; activates when it completed, marks
 * the record canceled when the session expired. Best effort — errors leave
 * the record pending for the next read.
 */
export async function reconcilePendingSubscription(subscriptionDoc) {
  if (!subscriptionDoc?.stripeCheckoutSessionId || subscriptionDoc.status !== 'incomplete') {
    return null;
  }

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.retrieve(subscriptionDoc.stripeCheckoutSessionId);

    if (session.status === 'complete' && session.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
      );
      stripeSubscription.metadata = { ...session.metadata, ...stripeSubscription.metadata };
      return await applyStripeSubscriptionState(stripeSubscription);
    }

    if (session.status === 'expired') {
      subscriptionDoc.status = 'canceled';
      subscriptionDoc.canceledAt = new Date();
      await subscriptionDoc.save();
    }

    return null;
  } catch (error) {
    logger.warn('Pending checkout reconciliation failed', { message: error.message });
    return null;
  }
}
