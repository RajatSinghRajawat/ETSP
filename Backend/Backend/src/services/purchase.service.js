import { env } from '../config/env.js';
import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { JobCredit } from '../models/job-credit.model.js';
import { Purchase } from '../models/purchase.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { getEmployerContext, getEntitlements, getPayPerJobPlan, normalizeFeatures } from './entitlement.service.js';
import { getOrCreateStripeCustomer, getStripe } from './stripe.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

/**
 * One-time purchase catalog (single source of truth, also served to the
 * frontend). Prices are GST-inclusive flat amounts. The pay_per_job amount
 * is read from the Pay Per Job plan document at checkout when present.
 */
export const ADDONS = {
  pay_per_job: { amountInr: 499, role: 'employer', label: 'Pay Per Job — 1 job post (14 days)' },
  unlock_credits_20: { amountInr: 199, credits: 20, role: 'employer', label: '20 profile unlock credits' },
  cv_unlock_1: { amountInr: 25, credits: 1, role: 'employer', label: '1 CV unlock credit' },
  cv_unlock_3: { amountInr: 75, credits: 3, role: 'employer', label: '3 CV unlock credits' },
  urgent_tag: { amountInr: 199, role: 'employer', label: 'Urgent Hiring tag for a job' },
  resume_builder: { amountInr: 25, credits: 1, role: 'candidate', label: 'Resume builder — 1 resume' },
};

const paymentTestModeEnabled = () => env.PAYMENT_TEST_MODE && env.NODE_ENV !== 'production';

/** Eligibility checks per add-on type. Returns extra metadata for the purchase. */
async function assertPurchaseAllowed(user, type, jobId) {
  const addon = ADDONS[type];

  if (!addon) {
    throw new AppError('Unknown purchase type', 400);
  }

  if (user.role !== addon.role) {
    throw new AppError(`This purchase is for ${addon.role}s only`, 403);
  }

  let amountInr = addon.amountInr;
  let job = null;

  if (addon.role === 'employer') {
    const context = await getEmployerContext(user);

    if (!context.employerProfile) {
      throw new AppError('Employer profile not found for this account', 404);
    }

    if (type === 'unlock_credits_20' && !context.effectiveFeatures.creditAddonsEnabled) {
      throw new AppError(
        'The unlock-credits add-on is available on paid plans only. Buy a Pay Per Job credit or upgrade to Premium first.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }

    if ((type === 'cv_unlock_1' || type === 'cv_unlock_3') && !context.entitlements.features.perCvUnlockEnabled) {
      throw new AppError(
        'Per-CV unlocks are a Free-plan trial. Your plan includes larger unlock options instead.',
        403,
        undefined,
        'FEATURE_NOT_IN_PLAN',
      );
    }

    if (type === 'urgent_tag') {
      if (!jobId || !isObjectId(jobId)) {
        throw new AppError('A job is required for the urgent hiring tag', 400);
      }

      job = await Job.findOne({ _id: jobId, employerProfile: context.employerProfile._id })
        .select('_id title isUrgent')
        .lean();

      if (!job) {
        throw new AppError('Job not found', 404);
      }

      if (job.isUrgent) {
        throw new AppError('This job already has the urgent hiring tag', 400);
      }
    }

    if (type === 'pay_per_job') {
      const ppjPlan = await getPayPerJobPlan();

      if (ppjPlan?.priceInr) {
        amountInr = ppjPlan.priceInr;
      }
    }
  }

  if (type === 'resume_builder') {
    const entitlements = await getEntitlements(user);

    if (entitlements.features.resumeBuilderIncluded) {
      throw new AppError('The resume builder is already included in your plan', 400);
    }

    const candidate = await CandidateProfile.findOne({ email: user.email }).select('_id').lean();

    if (!candidate) {
      throw new AppError('Candidate profile not found for this account', 404);
    }
  }

  return { amountInr, job };
}

/**
 * Create a one-time Stripe Checkout (mode 'payment') for an add-on and a
 * pending Purchase record for webhook-free reconciliation. In payment test
 * mode the Stripe call is skipped and a `test_<purchaseId>` session id is
 * minted for the confirm endpoint.
 */
export async function createPurchaseCheckout(user, { type, jobId = null }) {
  const { amountInr, job } = await assertPurchaseAllowed(user, type, jobId);
  const addon = ADDONS[type];

  const purchase = await Purchase.create({
    user: user.id,
    userEmail: user.email,
    role: user.role,
    type,
    amountInr,
    job: job?._id ?? null,
  });

  if (paymentTestModeEnabled()) {
    const sessionId = `test_${purchase._id}`;
    purchase.stripeCheckoutSessionId = sessionId;
    await purchase.save();

    return {
      url: `${env.FRONTEND_BASE_URL}/billing/success?session_id=${sessionId}&kind=purchase`,
    };
  }

  const stripe = await getStripe();
  const customerId = await getOrCreateStripeCustomer(user);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          unit_amount: Math.round(amountInr * 100),
          product_data: { name: addon.label },
        },
        quantity: 1,
      },
    ],
    success_url: `${env.FRONTEND_BASE_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}&kind=purchase`,
    cancel_url: `${env.FRONTEND_BASE_URL}/pricing?canceled=1`,
    metadata: {
      userId: String(user.id),
      purchaseId: String(purchase._id),
      purchaseType: type,
      ...(job ? { jobId: String(job._id) } : {}),
    },
  });

  purchase.stripeCheckoutSessionId = session.id;
  await purchase.save();

  return { url: session.url };
}

/**
 * Apply a paid purchase's effects exactly once. The pending→paid transition
 * is the idempotency gate — only the winner of the findOneAndUpdate applies
 * effects, so webhook + success-page confirmation can race safely.
 */
export async function fulfillPurchase(purchaseId, { paymentIntentId = null } = {}) {
  const purchase = await Purchase.findOneAndUpdate(
    { _id: purchaseId, status: 'pending' },
    {
      $set: {
        status: 'paid',
        fulfilledAt: new Date(),
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      },
    },
    { new: true },
  );

  if (!purchase) {
    return Purchase.findById(purchaseId);
  }

  try {
    switch (purchase.type) {
      case 'pay_per_job': {
        const ppjPlan = await getPayPerJobPlan();
        const features = ppjPlan ? normalizeFeatures(ppjPlan) : {};
        const employerProfile = await EmployerProfile.findOne({ email: purchase.userEmail })
          .select('_id')
          .lean();

        if (!employerProfile) {
          throw new Error('Employer profile missing at fulfillment');
        }

        await JobCredit.create({
          employerProfile: employerProfile._id,
          userEmail: purchase.userEmail,
          purchase: purchase._id,
          validityDays: features.jobValidityDays ?? 14,
          unlockCreditsPerJob: features.unlockCreditsPerJob ?? 15,
        });
        break;
      }
      case 'unlock_credits_20':
      case 'cv_unlock_1':
      case 'cv_unlock_3': {
        const credits = ADDONS[purchase.type].credits;
        const result = await EmployerProfile.updateOne(
          { email: purchase.userEmail },
          { $inc: { unlockCreditBalance: credits } },
        );

        if (result.matchedCount === 0) {
          throw new Error('Employer profile missing at fulfillment');
        }
        break;
      }
      case 'urgent_tag': {
        if (purchase.job) {
          await Job.updateOne({ _id: purchase.job }, { $set: { isUrgent: true } });
        }
        break;
      }
      case 'resume_builder': {
        const result = await CandidateProfile.updateOne(
          { email: purchase.userEmail },
          { $inc: { resumeCreditBalance: 1 } },
        );

        if (result.matchedCount === 0) {
          throw new Error('Candidate profile missing at fulfillment');
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // Roll the status back so the next confirm/webhook retries fulfillment.
    logger.error('Purchase fulfillment failed — reverting to pending', {
      purchaseId: String(purchase._id),
      type: purchase.type,
      message: error.message,
    });
    await Purchase.updateOne(
      { _id: purchase._id },
      { $set: { status: 'pending', fulfilledAt: null } },
    );
    throw new AppError('Could not apply this purchase yet. Please try again.', 500);
  }

  return purchase;
}

/** Success-page confirmation — verifies the session with Stripe (or test id). */
export async function confirmPurchase(user, sessionId) {
  if (paymentTestModeEnabled() && String(sessionId).startsWith('test_')) {
    const purchaseId = String(sessionId).slice('test_'.length);

    if (!isObjectId(purchaseId)) {
      throw new AppError('Checkout session not found', 404);
    }

    const purchase = await Purchase.findOne({ _id: purchaseId, user: user.id });

    if (!purchase) {
      throw new AppError('Checkout session not found', 404);
    }

    const fulfilled = await fulfillPurchase(purchase._id);
    return serializePurchase(fulfilled);
  }

  const purchase = await Purchase.findOne({ stripeCheckoutSessionId: sessionId, user: user.id });

  if (!purchase) {
    throw new AppError('Checkout session not found', 404);
  }

  if (purchase.status === 'paid') {
    return serializePurchase(purchase);
  }

  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null);

  if (!session) {
    throw new AppError('Checkout session not found', 404);
  }

  if (session.payment_status !== 'paid') {
    throw new AppError('Payment has not been completed for this checkout session', 402);
  }

  const fulfilled = await fulfillPurchase(purchase._id, {
    paymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
  });

  return serializePurchase(fulfilled);
}

/** Webhook path: fulfill by checkout session id (idempotent). */
export async function fulfillPurchaseBySessionId(sessionId, { paymentIntentId = null } = {}) {
  const purchase = await Purchase.findOne({ stripeCheckoutSessionId: sessionId });

  if (!purchase) {
    return null;
  }

  return fulfillPurchase(purchase._id, { paymentIntentId });
}

/**
 * Lazy reconciliation of recent pending purchases (user paid but never came
 * back to the success page). Called from usage reads. Best effort.
 */
export async function reconcilePendingPurchases(user) {
  if (paymentTestModeEnabled()) {
    return;
  }

  const pending = await Purchase.find({
    user: user.id,
    status: 'pending',
    stripeCheckoutSessionId: { $ne: null },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  if (!pending.length) {
    return;
  }

  let stripe;
  try {
    stripe = await getStripe();
  } catch {
    return;
  }

  for (const purchase of pending) {
    try {
      const session = await stripe.checkout.sessions.retrieve(purchase.stripeCheckoutSessionId);

      if (session.payment_status === 'paid') {
        await fulfillPurchase(purchase._id, {
          paymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
        });
      } else if (session.status === 'expired') {
        purchase.status = 'expired';
        await purchase.save();
      }
    } catch (error) {
      logger.warn('Pending purchase reconciliation failed', {
        purchaseId: String(purchase._id),
        message: error.message,
      });
    }
  }
}

function serializePurchase(purchase) {
  return {
    _id: String(purchase._id),
    type: purchase.type,
    amountInr: purchase.amountInr,
    status: purchase.status,
    job: purchase.job ? String(purchase.job) : null,
    fulfilledAt: purchase.fulfilledAt,
    createdAt: purchase.createdAt,
  };
}

export async function listMyPurchases(user) {
  const purchases = await Purchase.find({ user: user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return { items: purchases.map(serializePurchase) };
}

export async function listPurchasesAdmin(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const filters = {};

  if (query.type && ADDONS[query.type]) {
    filters.type = query.type;
  }

  if (['pending', 'paid', 'expired', 'failed'].includes(query.status)) {
    filters.status = query.status;
  }

  if (query.search) {
    filters.userEmail = new RegExp(
      String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
  }

  const [items, total] = await Promise.all([
    Purchase.find(filters)
      .populate('job', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Purchase.countDocuments(filters),
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
