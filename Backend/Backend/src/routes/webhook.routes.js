import { handleStripeWebhook } from '../controllers/stripe-webhook.controller.js';

/**
 * Stripe webhooks. Signature verification needs the raw request body, so this
 * plugin overrides the JSON content-type parser to keep the body as a Buffer.
 * Fastify encapsulation scopes the override to these routes only.
 * No auth — authenticity comes from the Stripe signature. Rate limiting is
 * disabled so bursts of Stripe retries are never throttled.
 */
export async function webhookRoutes(app) {
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_request, body, done) => done(null, body),
  );

  app.post('/stripe', { config: { rateLimit: false } }, handleStripeWebhook);
}
