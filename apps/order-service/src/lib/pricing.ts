import type { DiscountType } from '@biashara-mall/prisma';
import type { DiscountApplied, SessionCartItem } from './session';

/** A coupon never pays out more than the item it applies to is worth. */
export function computeDiscount(
  itemTotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const raw =
    discountType === 'percentage'
      ? itemTotal * (discountValue / 100)
      : discountValue;
  return Math.round(Math.min(raw, itemTotal) * 100) / 100;
}

export interface ShopSplit {
  shopId: string;
  items: SessionCartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
}

/** One cart becomes one order per shop. The coupon is scoped to a single
 * product, so it comes off only the shop that stocks it. */
export function splitCartByShop(
  cart: SessionCartItem[],
  discount?: DiscountApplied | null,
): ShopSplit[] {
  const byShop = new Map<string, SessionCartItem[]>();
  for (const item of cart) {
    const items = byShop.get(item.shopId);
    if (items) items.push(item);
    else byShop.set(item.shopId, [item]);
  }

  return [...byShop].map(([shopId, items]) => {
    const subtotal = items.reduce(
      (sum, i) => sum + i.salePrice * i.quantity,
      0,
    );
    const discountAmount =
      discount &&
      items.some((i) => i.productId === discount.discountedProductId)
        ? discount.discountAmount
        : 0;
    return {
      shopId,
      items,
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    };
  });
}
