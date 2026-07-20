import { Plan } from '../models/plan.model.js';
import { Subscription } from '../models/subscription.model.js';
import { AppError } from '../utils/app-error.js';
import { archivePlanInStripe, isStripeConfigured, syncPlanToStripe } from './stripe.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

const PUBLIC_PLAN_FIELDS =
  '_id name description audience planKey priceInr annualPriceInr interval features isFree sortOrder';

function assertFreePriceConsistency(plan) {
  if (plan.isFree !== (plan.priceInr === 0)) {
    throw new AppError('Free plans must have a price of 0, and ₹0 plans must be marked as free', 400);
  }
}

// Belt-and-braces with the partial unique index — also covers the window
// while the index is still building on a fresh collection.
async function assertSingleFreePlan(plan) {
  if (!plan.isFree) {
    return;
  }

  const existing = await Plan.findOne({
    _id: { $ne: plan._id },
    audience: plan.audience,
    isFree: true,
  })
    .select('_id')
    .lean();

  if (existing) {
    throw new AppError(`A free plan already exists for ${plan.audience}s`, 409);
  }
}

async function findPlanOr404(id) {
  if (!isObjectId(id)) {
    throw new AppError('Plan not found', 404);
  }

  const plan = await Plan.findById(id);

  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  return plan;
}

export async function listPlansAdmin(query = {}) {
  const filters = {};

  if (query.audience === 'employer' || query.audience === 'candidate') {
    filters.audience = query.audience;
  }

  const [plans, counts] = await Promise.all([
    Plan.find(filters).sort({ audience: 1, sortOrder: 1, createdAt: 1 }).lean(),
    Subscription.aggregate([
      { $match: { status: { $in: ['active', 'past_due'] } } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((entry) => [String(entry._id), entry.count]));

  return plans.map((plan) => ({
    ...plan,
    subscriberCount: countMap.get(String(plan._id)) ?? 0,
    stripeSynced: Boolean(plan.stripePriceId),
  }));
}

export async function createPlan(input) {
  await assertSingleFreePlan({ ...input, _id: null });

  try {
    const plan = await Plan.create(input);
    await syncPlanToStripe(plan);

    return { ...plan.toObject(), stripeSynced: Boolean(plan.stripePriceId) };
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(`A free plan already exists for ${input.audience}s`, 409);
    }

    throw error;
  }
}

export async function updatePlan(id, input) {
  const plan = await findPlanOr404(id);

  const { features, ...rest } = input;
  plan.set(rest);
  if (features) {
    for (const [key, value] of Object.entries(features)) {
      plan.set(`features.${key}`, value);
    }
  }

  assertFreePriceConsistency(plan);
  await assertSingleFreePlan(plan);

  try {
    await plan.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError(`A free plan already exists for ${plan.audience}s`, 409);
    }

    throw error;
  }

  await syncPlanToStripe(plan);

  return { ...plan.toObject(), stripeSynced: Boolean(plan.stripePriceId) };
}

/**
 * "Delete" = deactivate. Plans referenced by live subscriptions or serving as
 * the free fallback must stay; deactivation hides them from pricing pages and
 * blocks new checkouts while existing subscribers keep their entitlements.
 */
export async function deactivatePlan(id) {
  const plan = await findPlanOr404(id);

  if (plan.isFree) {
    throw new AppError('The free plan cannot be deleted — it is the fallback for users without a subscription', 409);
  }

  const liveSubscribers = await Subscription.countDocuments({
    plan: plan._id,
    status: { $in: ['active', 'past_due', 'incomplete'] },
  });

  if (liveSubscribers > 0) {
    throw new AppError(
      `This plan has ${liveSubscribers} active subscriber(s). It has to keep existing until they cancel; you can deactivate it instead.`,
      409,
    );
  }

  plan.isActive = false;
  await plan.save();
  await archivePlanInStripe(plan);

  return plan.toObject();
}

export async function resyncPlan(id) {
  const plan = await findPlanOr404(id);

  if (plan.isFree) {
    throw new AppError('Free plans are not synced to Stripe', 400);
  }

  if (!(await isStripeConfigured())) {
    throw new AppError('Stripe is not configured yet', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  await syncPlanToStripe(plan);

  return { ...plan.toObject(), stripeSynced: Boolean(plan.stripePriceId) };
}

/** Public pricing data — active plans only, no Stripe identifiers. */
export async function listPublicPlans(audience) {
  if (audience !== 'employer' && audience !== 'candidate') {
    throw new AppError('audience must be employer or candidate', 400);
  }

  return Plan.find({ audience, isActive: true })
    .select(PUBLIC_PLAN_FIELDS)
    .sort({ sortOrder: 1, priceInr: 1 })
    .lean();
}

export async function getFreePlan(audience) {
  return Plan.findOne({ audience, isFree: true, isActive: true }).lean();
}
