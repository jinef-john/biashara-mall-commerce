import { describe, expect, test } from 'bun:test';
import { platformFee, sellerEarning } from '@biashara-mall/config';
import {
  computeDiscount,
  splitCartByShop,
} from '../apps/order-service/src/lib/pricing';
import { fingerprintCart } from '../apps/order-service/src/lib/session';
import type { SessionCartItem } from '../apps/order-service/src/lib/session';

function item(over: Partial<SessionCartItem> = {}): SessionCartItem {
  return {
    productId: 'p1',
    title: 'Thing',
    quantity: 1,
    salePrice: 100,
    shopId: 's1',
    ...over,
  } as SessionCartItem;
}

describe('computeDiscount', () => {
  test('percentage is a share of the item total', () => {
    expect(computeDiscount(200, 'percentage', 10)).toBe(20);
  });

  test('flat is the value itself', () => {
    expect(computeDiscount(200, 'flat', 15)).toBe(15);
  });

  test('never exceeds what the item is worth', () => {
    expect(computeDiscount(30, 'flat', 500)).toBe(30);
    expect(computeDiscount(30, 'percentage', 150)).toBe(30);
  });

  test('rounds to cents', () => {
    expect(computeDiscount(19.99, 'percentage', 33)).toBe(6.6);
  });

  test('a full-value coupon leaves nothing to pay', () => {
    expect(computeDiscount(49.5, 'percentage', 100)).toBe(49.5);
  });
});

describe('splitCartByShop', () => {
  test('one order per shop, each with its own subtotal', () => {
    const splits = splitCartByShop([
      item({ productId: 'a', shopId: 's1', salePrice: 10, quantity: 2 }),
      item({ productId: 'b', shopId: 's2', salePrice: 5, quantity: 3 }),
      item({ productId: 'c', shopId: 's1', salePrice: 1, quantity: 1 }),
    ]);

    expect(splits.map((s) => s.shopId)).toEqual(['s1', 's2']);
    expect(splits[0].subtotal).toBe(21);
    expect(splits[1].subtotal).toBe(15);
  });

  test('the coupon comes off only the shop stocking that product', () => {
    const splits = splitCartByShop(
      [
        item({ productId: 'a', shopId: 's1', salePrice: 100 }),
        item({ productId: 'b', shopId: 's2', salePrice: 100 }),
      ],
      { discountAmount: 30, discountedProductId: 'b', discountType: 'flat' },
    );

    expect(splits.find((s) => s.shopId === 's1')).toMatchObject({
      discountAmount: 0,
      total: 100,
    });
    expect(splits.find((s) => s.shopId === 's2')).toMatchObject({
      discountAmount: 30,
      total: 70,
    });
  });

  test('a coupon for a product no longer in the cart discounts nobody', () => {
    const splits = splitCartByShop([item({ productId: 'a', shopId: 's1' })], {
      discountAmount: 30,
      discountedProductId: 'gone',
      discountType: 'flat',
    });

    expect(splits[0].discountAmount).toBe(0);
    expect(splits[0].total).toBe(100);
  });

  test('an empty cart produces no orders', () => {
    expect(splitCartByShop([])).toEqual([]);
  });
});

describe('platform fee', () => {
  test('takes 10% and leaves the rest to the seller', () => {
    expect(platformFee(100)).toBe(10);
    expect(sellerEarning(100)).toBe(90);
  });

  test('the two halves always add back up to the total', () => {
    for (const total of [0.01, 9.99, 19.95, 123.45, 1000]) {
      expect(platformFee(total) + sellerEarning(total)).toBeCloseTo(total, 2);
    }
  });
});

describe('fingerprintCart', () => {
  test('item order does not change the fingerprint', () => {
    const a = item({ productId: 'a' });
    const b = item({ productId: 'b' });
    expect(fingerprintCart([a, b])).toBe(fingerprintCart([b, a]));
  });

  test('a changed quantity is a different checkout', () => {
    expect(fingerprintCart([item({ quantity: 1 })])).not.toBe(
      fingerprintCart([item({ quantity: 2 })]),
    );
  });

  test('a changed price is a different checkout', () => {
    expect(fingerprintCart([item({ salePrice: 10 })])).not.toBe(
      fingerprintCart([item({ salePrice: 11 })]),
    );
  });

  test('the title is not economically relevant', () => {
    expect(fingerprintCart([item({ title: 'A' })])).toBe(
      fingerprintCart([item({ title: 'B' })]),
    );
  });
});
