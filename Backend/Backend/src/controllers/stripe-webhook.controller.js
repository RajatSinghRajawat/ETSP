import { ProcessedWebhookEvent } from '../models/processed-webhook-event.model.js';
import { fulfillPurchaseBySessionId } from '../services/purchase.service.js';
import {
  applyStripeSubscriptionState,
  confirmCheckoutSessionById,
} from '../services/subscription-sync.service.js';
import { getStripe, getWebhookSecret } from '../services/stripe.service.js';
import { logger } from '../utils/logger.js';

/**
 * OPTIONAL Stripe webhook endpoint. The subscription flow works entirely
 * without webhooks (state is pulled from the Stripe API on confirmation and
 * lazily on entitlement reads) — configuring a webhook secret simply makes
 * updates arrive sooner. Without a configured secret this returns 503.
 */
export async function handleStripeWebhook(request, reply) {
  let stripe;
  let webhookSecret;

  try {
    [stripe, webhookSecret] = await Promise.all([getStripe(), getWebhookSecret()]);
  } catch {
    return reply.code(503).send({ success: false, message: 'Stripe webhook is not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      request.headers['stripe-signature'],
      webhookSecret,
    );
  } catch (error) {
    logger.warn('Stripe webhook signature verification failed', { message: error.message });
    return reply.code(400).send({ success: false, message: 'Invalid webhook signature' });
  }

  // Skip already-processed deliveries. The ledger entry is written only after
  // successful handling, so a failed attempt stays retryable; handlers are
  // idempotent upserts, so a race between retries is harmless.
  const alreadyProcessed = await ProcessedWebhookEvent.exists({ eventId: event.id });

  if (alreadyProcessed) {
    return reply.send({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (event.data.object.mode === 'subscription') {
          await confirmCheckoutSessionById(event.data.object.id).catch((error) =>
            logger.warn('Webhook checkout confirmation skipped', { message: error.message }),
          );
        } else if (event.data.object.mode === 'payment') {
          const session = event.data.object;
          await fulfillPurchaseBySessionId(session.id, {
            paymentIntentId:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent?.id,
          }).catch((error) =>
            logger.warn('Webhook purchase fulfillment skipped', { message: error.message }),
          );
        }
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applyStripeSubscriptionState(event.data.object);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const stripeSubscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id ?? invoice.parent?.subscription_details?.subscription;

        if (stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          await applyStripeSubscriptionState(stripeSubscription);
        }
        break;
      }
      default:
        break;
    }

    await ProcessedWebhookEvent.create({ eventId: event.id, type: event.type }).catch((error) => {
      if (error?.code !== 11000) throw error;
    });

    return reply.send({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing failed', {
      eventId: event.id,
      type: event.type,
      message: error.message,
    });

    // Non-2xx makes Stripe retry the delivery later.
    return reply.code(500).send({ success: false, message: 'Webhook processing failed' });
  }
}
