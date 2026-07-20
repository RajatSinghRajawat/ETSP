import Stripe from 'stripe';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { getStripeSettings } from './settings.service.js';

// Cached client — settings live in MongoDB, so the client is built lazily and
// invalidated whenever the admin saves new keys (resetStripeClient).
let cachedClient = null;
let cachedSecretKey = null;

export function resetStripeClient() {
  cachedClient = null;
  cachedSecretKey = null;
}

export async function getStripe() {
  const settings = await getStripeSettings();

  if (!settings?.secretKey) {
    throw new AppError(
      'Payments are not configured yet. Please contact support.',
      503,
      undefined,
      'STRIPE_NOT_CONFIGURED',
    );
  }

  if (!cachedClient || cachedSecretKey !== settings.secretKey) {
    cachedClient = new Stripe(settings.secretKey);
    cachedSecretKey = settings.secretKey;
  }

  return cachedClient;
}

export async function getWebhookSecret() {
  const settings = await getStripeSettings();

  if (!settings?.webhookSecret) {
    throw new AppError('Stripe webhook secret is not configured', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  return settings.webhookSecret;
}

/** True when a secret key has been saved — used to skip optional syncs. */
export async function isStripeConfigured() {
  const settings = await getStripeSettings();
  return Boolean(settings?.secretKey);
}

/**
 * Ensure the plan's field (`stripePriceId` / `stripeAnnualPriceId`) points at
 * an active recurring Price with the right amount+interval. Prices are
 * immutable in Stripe, so a change creates a new Price and deactivates the
 * old one. Mutates the plan in memory; the caller saves.
 */
async function ensureRecurringPrice(stripe, plan, field, amountInr, interval) {
  const unitAmount = Math.round(amountInr * 100);
  let needsNewPrice = !plan[field];

  if (plan[field]) {
    const existingPrice = await stripe.prices.retrieve(plan[field]).catch(() => null);
    needsNewPrice =
      !existingPrice ||
      !existingPrice.active ||
      existingPrice.unit_amount !== unitAmount ||
      existingPrice.recurring?.interval !== interval;

    if (needsNewPrice && existingPrice?.active) {
      await stripe.prices
        .update(plan[field], { active: false })
        .catch((error) => logger.warn('Stripe price deactivation failed', { message: error.message }));
    }
  }

  if (needsNewPrice) {
    const price = await stripe.prices.create({
      product: plan.stripeProductId,
      currency: 'inr',
      unit_amount: unitAmount,
      recurring: { interval },
      metadata: { planId: String(plan._id), billingInterval: interval },
    });
    plan[field] = price.id;
  }
}

/**
 * Ensure a paid recurring plan has a Stripe Product and active Prices
 * (monthly, plus yearly when `annualPriceInr` is set). One-time plans
 * (interval 'one_time', e.g. Pay Per Job) are bought through the Purchase
 * flow with inline price_data — nothing to sync. Mutates and saves the plan
 * document in place. No-op for free plans or when Stripe is not configured.
 */
export async function syncPlanToStripe(plan) {
  if (plan.isFree || plan.priceInr === 0 || plan.interval === 'one_time') {
    return plan;
  }

  if (!(await isStripeConfigured())) {
    return plan;
  }

  const stripe = await getStripe();

  if (!plan.stripeProductId) {
    const product = await stripe.products.create({
      name: `${plan.name} (${plan.audience})`,
      metadata: { planId: String(plan._id), audience: plan.audience },
    });
    plan.stripeProductId = product.id;
  } else {
    await stripe.products
      .update(plan.stripeProductId, { name: `${plan.name} (${plan.audience})` })
      .catch((error) => logger.warn('Stripe product rename failed', { message: error.message }));
  }

  await ensureRecurringPrice(stripe, plan, 'stripePriceId', plan.priceInr, 'month');

  if (plan.annualPriceInr && plan.annualPriceInr > 0) {
    await ensureRecurringPrice(stripe, plan, 'stripeAnnualPriceId', plan.annualPriceInr, 'year');
  } else if (plan.stripeAnnualPriceId) {
    await stripe.prices
      .update(plan.stripeAnnualPriceId, { active: false })
      .catch((error) => logger.warn('Stripe annual price deactivation failed', { message: error.message }));
    plan.stripeAnnualPriceId = null;
  }

  await plan.save();

  return plan;
}

/**
 * Find (or create) the Stripe customer for a user, reusing the id stored on
 * any previous subscription. Shared by the subscription and purchase flows.
 */
export async function getOrCreateStripeCustomer(user) {
  const stripe = await getStripe();
  const { Subscription } = await import('../models/subscription.model.js');

  const previous = await Subscription.findOne({
    user: user.id,
    stripeCustomerId: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .select('stripeCustomerId')
    .lean();

  if (previous?.stripeCustomerId) {
    return previous.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: String(user.id) },
  });

  return customer.id;
}

/** Archive the Stripe product/price of a deactivated plan (best effort). */
export async function archivePlanInStripe(plan) {
  if (!plan.stripeProductId || !(await isStripeConfigured())) {
    return;
  }

  const stripe = await getStripe();

  if (plan.stripePriceId) {
    await stripe.prices
      .update(plan.stripePriceId, { active: false })
      .catch((error) => logger.warn('Stripe price archive failed', { message: error.message }));
  }

  await stripe.products
    .update(plan.stripeProductId, { active: false })
    .catch((error) => logger.warn('Stripe product archive failed', { message: error.message }));
}
