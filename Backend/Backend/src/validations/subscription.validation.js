import { z } from 'zod';

export const checkoutSchema = z.object({
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan id'),
  billingInterval: z.enum(['month', 'year']).default('month'),
});

// Stripe checkout session ids, plus `test_sub_<subscriptionId>` ids minted by
// the PAYMENT_TEST_MODE bypass.
export const confirmSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .regex(
      /^(cs_(test|live)_[A-Za-z0-9]+|test_sub_[0-9a-fA-F]{24})$/,
      'Invalid checkout session id',
    ),
});

export const grantSubscriptionSchema = z.object({
  userEmail: z.string().trim().email().toLowerCase(),
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan id'),
  days: z.number().int().min(1).max(3650).default(30),
});
