import mongoose from 'mongoose';

/**
 * Idempotency ledger for Stripe webhook events — a duplicate delivery is
 * acknowledged without reprocessing. TTL keeps the collection small; Stripe
 * retries span days, 30 days is a comfortable margin.
 */
const processedWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 },
  },
  {
    versionKey: false,
  },
);

export const ProcessedWebhookEvent = mongoose.model(
  'ProcessedWebhookEvent',
  processedWebhookEventSchema,
);
