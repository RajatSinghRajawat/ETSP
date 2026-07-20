import { getCalendarMonthPeriod } from '../src/services/entitlement.service.js';

describe('entitlement period math', () => {
  test('calendar month period spans the current UTC month', () => {
    const now = new Date(Date.UTC(2026, 6, 12, 15, 30));
    const { periodStart, periodEnd } = getCalendarMonthPeriod(now);

    expect(periodStart.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(periodEnd.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  test('handles December → January rollover', () => {
    const now = new Date(Date.UTC(2026, 11, 31, 23, 59));
    const { periodStart, periodEnd } = getCalendarMonthPeriod(now);

    expect(periodStart.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(periodEnd.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});
