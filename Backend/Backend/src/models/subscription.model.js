import mongoose from 'mongoose';

/**
 * A user's Stripe-backed subscription to a plan. At most one non-canceled
 * subscription may exist per (user, audienceRole) — enforced in the service
 * layer whenever a subscription is activated.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    audienceRole: { type: String, enum: ['employer', 'candidate'], required: true },
    stripeCustomerId: { type: String, default: null, index: true },
    // Uniqueness enforced by a partial index below — a sparse unique index
    // would still collide on explicit nulls (test-mode/admin-granted subs).
    stripeSubscriptionId: { type: String, default: null },
    // Checkout session that created this record — used to reconcile payments
    // without webhooks (user paid but never returned to the success page).
    stripeCheckoutSessionId: { type: String, default: null },
    status: {
      type: String,
      enum: ['incomplete', 'active', 'past_due', 'canceled'],
      default: 'incomplete',
      index: true,
    },
    // Whether the user bought the monthly or the annual price of the plan.
    billingInterval: { type: String, enum: ['month', 'year'], default: 'month' },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

subscriptionSchema.index({ user: 1, audienceRole: 1, status: 1 });
subscriptionSchema.index(
  { stripeSubscriptionId: 1 },
  { unique: true, partialFilterExpression: { stripeSubscriptionId: { $type: 'string' } } },
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
