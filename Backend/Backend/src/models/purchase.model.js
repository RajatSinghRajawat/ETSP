import mongoose from 'mongoose';

/**
 * A one-time Stripe payment (mode: 'payment'): pay-per-job posts and the
 * add-ons (unlock credits, urgent tag, resume builder). Fulfillment effects
 * are applied exactly once via the pending→paid status transition.
 */
const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ['employer', 'candidate'], required: true },
    type: {
      type: String,
      enum: [
        'pay_per_job',
        'unlock_credits_20',
        'cv_unlock_1',
        'cv_unlock_3',
        'urgent_tag',
        'resume_builder',
      ],
      required: true,
      index: true,
    },
    amountInr: { type: Number, required: true, min: 0 },
    // Target job for urgent_tag purchases.
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    // Uniqueness enforced by a partial index below — a sparse unique index
    // would still collide on the explicit nulls new purchases start with.
    stripeCheckoutSessionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'failed'],
      default: 'pending',
      index: true,
    },
    fulfilledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

purchaseSchema.index({ user: 1, status: 1, createdAt: -1 });
purchaseSchema.index(
  { stripeCheckoutSessionId: 1 },
  { unique: true, partialFilterExpression: { stripeCheckoutSessionId: { $type: 'string' } } },
);

export const Purchase = mongoose.model('Purchase', purchaseSchema);
