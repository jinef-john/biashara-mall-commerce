import { describe, expect, test } from 'bun:test';
import type { UserAction } from '@biashara-mall/prisma';
import { weightsOf } from '../apps/recommendation-service/src/services/item-similarity.service';

const action = (over: Partial<UserAction>): UserAction =>
  ({ action: 'product_view', productId: 'p1', ...over }) as UserAction;

describe('weightsOf', () => {
  test('ranks intent: purchase over cart over wishlist over view', () => {
    const weights = weightsOf([
      action({ productId: 'bought', action: 'purchase' }),
      action({ productId: 'carted', action: 'add_to_cart' }),
      action({ productId: 'wished', action: 'add_to_wishlist' }),
      action({ productId: 'viewed', action: 'product_view' }),
    ]);

    const ordered = [...weights].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    expect(ordered).toEqual(['bought', 'carted', 'wished', 'viewed']);
  });

  test('a product keeps its strongest signal, not its latest', () => {
    const weights = weightsOf([
      action({ productId: 'p', action: 'purchase' }),
      action({ productId: 'p', action: 'product_view' }),
    ]);
    expect(weights.get('p')).toBe(1);
  });

  test('viewing something ten times does not make it a purchase', () => {
    const views = Array.from({ length: 10 }, () => action({ productId: 'p' }));
    expect(weightsOf(views).get('p')).toBe(0.1);
  });

  test('actions with no product are skipped', () => {
    expect(
      weightsOf([action({ productId: null as unknown as string })]).size,
    ).toBe(0);
  });

  test('an unrecognised action contributes nothing', () => {
    expect(
      weightsOf([action({ action: 'shop_visit' as UserAction['action'] })])
        .size,
    ).toBe(0);
  });
});
