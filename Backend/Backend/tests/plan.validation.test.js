import { createPlanSchema, updatePlanSchema } from '../src/validations/plan.validation.js';

describe('plan validation', () => {
  const validPaidPlan = {
    name: 'Pro Employer',
    audience: 'employer',
    priceInr: 999,
    features: { aiEnabled: true, autoReplyEnabled: true, maxJobPosts: 20, maxApplications: null },
  };

  test('accepts a valid paid plan and applies defaults', () => {
    const parsed = createPlanSchema.parse(validPaidPlan);

    expect(parsed.isFree).toBe(false);
    expect(parsed.isActive).toBe(true);
    expect(parsed.interval).toBe('month');
    expect(parsed.features.maxJobPosts).toBe(20);
    expect(parsed.features.maxApplications).toBeNull();
  });

  test('accepts a valid free plan', () => {
    const parsed = createPlanSchema.parse({
      name: 'Free',
      audience: 'candidate',
      priceInr: 0,
      isFree: true,
      features: { maxApplications: 5 },
    });

    expect(parsed.isFree).toBe(true);
    expect(parsed.features.aiEnabled).toBe(false);
  });

  test('rejects a free plan with a non-zero price', () => {
    const result = createPlanSchema.safeParse({ ...validPaidPlan, isFree: true });

    expect(result.success).toBe(false);
  });

  test('rejects a ₹0 plan that is not marked free', () => {
    const result = createPlanSchema.safeParse({ ...validPaidPlan, priceInr: 0 });

    expect(result.success).toBe(false);
  });

  test('rejects negative limits', () => {
    const result = createPlanSchema.safeParse({
      ...validPaidPlan,
      features: { maxJobPosts: -1 },
    });

    expect(result.success).toBe(false);
  });

  test('update schema does not accept audience changes', () => {
    const parsed = updatePlanSchema.parse({ audience: 'candidate', name: 'Renamed' });

    expect(parsed).not.toHaveProperty('audience');
    expect(parsed.name).toBe('Renamed');
  });

  test('update schema allows partial feature updates', () => {
    const parsed = updatePlanSchema.parse({ priceInr: 499 });

    expect(parsed.priceInr).toBe(499);
    expect(parsed).not.toHaveProperty('name');
  });

  test('update schema never injects defaults for omitted fields', () => {
    const parsed = updatePlanSchema.parse({ features: { autoReplyEnabled: true } });

    // Regression: zod defaults fire through .partial(), which would reset
    // isFree/priceInr/other feature flags on every partial update.
    expect(Object.keys(parsed)).toEqual(['features']);
    expect(Object.keys(parsed.features)).toEqual(['autoReplyEnabled']);
  });
});
