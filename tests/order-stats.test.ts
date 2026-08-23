import { describe, expect, test } from 'bun:test';
import { buildOrderStats } from '../apps/order-service/src/lib/order-stats';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function order(
  over: Partial<Parameters<typeof buildOrderStats>[0][number]> = {},
) {
  return {
    createdAt: daysAgo(1),
    total: 100,
    paymentStatus: 'paid',
    shippingAddress: { country: 'KE' },
    ...over,
  };
}

describe('buildOrderStats', () => {
  test('emits one bucket per requested day even with no orders', () => {
    const stats = buildOrderStats([], 7);
    expect(stats.daily).toHaveLength(7);
    expect(stats.daily.every((d) => d.orders === 0 && d.revenue === 0)).toBe(
      true,
    );
    expect(stats.totals).toEqual({ orders: 0, revenue: 0 });
  });

  test('days come back in chronological order', () => {
    const dates = buildOrderStats([], 5).daily.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);
  });

  test('an unpaid order counts as an order but earns nothing', () => {
    const stats = buildOrderStats(
      [
        order({ paymentStatus: 'paid', total: 60 }),
        order({ paymentStatus: 'pending', total: 40 }),
      ],
      7,
    );
    expect(stats.totals).toEqual({ orders: 2, revenue: 60 });
    expect(stats.countries[0]).toEqual({
      country: 'KE',
      orders: 2,
      revenue: 60,
    });
  });

  test('an order older than the window is still in the totals, not the chart', () => {
    const stats = buildOrderStats([order({ createdAt: daysAgo(60) })], 7);
    expect(stats.daily.reduce((sum, d) => sum + d.orders, 0)).toBe(0);
    expect(stats.totals.orders).toBe(1);
  });

  test('countries are ranked by order count', () => {
    const stats = buildOrderStats(
      [
        order({ shippingAddress: { country: 'US' } }),
        order({ shippingAddress: { country: 'KE' } }),
        order({ shippingAddress: { country: 'KE' } }),
      ],
      7,
    );
    expect(stats.countries.map((c) => c.country)).toEqual(['KE', 'US']);
  });

  test("today's orders land in the last bucket", () => {
    const stats = buildOrderStats([order({ createdAt: daysAgo(0) })], 7);
    expect(stats.daily.at(-1)).toMatchObject({ orders: 1, revenue: 100 });
  });
});
