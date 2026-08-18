import { redis } from '@biashara-mall/redis';

export interface SessionCartItem {
  productId: string;
  title: string;
  quantity: number;
  salePrice: number;
  shopId: string;
  selectedOptions: { color?: string; size?: string } | null;
}

export interface ShippingAddressSnapshot {
  label: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface DiscountApplied {
  discountAmount: number;
  discountedProductId: string;
  discountType: 'percentage' | 'flat';
}

export interface PaymentSessionData {
  sessionId: string;
  userId: string;
  cart: SessionCartItem[];
  shopIds: string[];
  shippingAddress: ShippingAddressSnapshot;
  subtotal: number;
  total: number;
  couponCode: string | null;
  discount: DiscountApplied | null;
  createdAt: number;
}

const SESSION_TTL_SECONDS = 600;
const SESSION_KEY = (sessionId: string) => `payment-session:${sessionId}`;

/** Stable fingerprint of a cart's economically-relevant fields, used to
 * detect "this is the same checkout attempt" so re-opening checkout reuses
 * a session instead of orphaning the previous one in Redis. */
export function fingerprintCart(cart: SessionCartItem[]): string {
  return JSON.stringify(
    [...cart]
      .map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        salePrice: i.salePrice,
        shopId: i.shopId,
        selectedOptions: i.selectedOptions ?? null,
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  );
}

export async function getSession(sessionId: string): Promise<PaymentSessionData | null> {
  const raw = await redis.get(SESSION_KEY(sessionId));
  return raw ? (JSON.parse(raw) as PaymentSessionData) : null;
}

export async function saveSession(session: PaymentSessionData): Promise<void> {
  await redis.setex(SESSION_KEY(session.sessionId), SESSION_TTL_SECONDS, JSON.stringify(session));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(SESSION_KEY(sessionId));
}

/** Scans existing sessions for this user and returns one whose cart
 * fingerprint still matches, deleting any stale ones it finds along the way. */
export async function findReusableSession(
  userId: string,
  fingerprint: string,
): Promise<PaymentSessionData | null> {
  let cursor = '0';
  let reusable: PaymentSessionData | null = null;

  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', 'payment-session:*', 'COUNT', 100);
    cursor = next;

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      const session = JSON.parse(raw) as PaymentSessionData;
      if (session.userId !== userId) continue;

      if (fingerprintCart(session.cart) === fingerprint) {
        reusable = session;
      } else {
        await redis.del(key);
      }
    }
  } while (cursor !== '0');

  return reusable;
}
