import { z } from 'zod';

export const purchaseCheckoutSchema = z.object({
  type: z.enum([
    'pay_per_job',
    'unlock_credits_20',
    'cv_unlock_1',
    'cv_unlock_3',
    'urgent_tag',
    'resume_builder',
  ]),
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid job id').nullish(),
});

// Stripe checkout session ids, plus `test_<purchaseId>` ids minted by the
// PAYMENT_TEST_MODE bypass.
export const purchaseConfirmSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .regex(/^(cs_(test|live)_[A-Za-z0-9]+|test_[0-9a-fA-F]{24})$/, 'Invalid checkout session id'),
});
