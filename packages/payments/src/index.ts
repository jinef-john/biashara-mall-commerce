import { stripeProvider } from './stripe';
import { mockProvider } from './mock';
import type { PaymentProvider } from './types';

export * from './types';

/**
 * `PAYMENT_PROVIDER=stripe` forces the real provider; otherwise mock is used
 * unless a Stripe key is actually configured. Order-service and seller-service
 * must only ever import this factory — never `stripe` directly.
 */
export function getPaymentProvider(): PaymentProvider {
  const forced = process.env.PAYMENT_PROVIDER;
  if (forced === 'mock') return mockProvider;
  if (forced === 'stripe' || process.env.STRIPE_SECRET_KEY) return stripeProvider;
  return mockProvider;
}
