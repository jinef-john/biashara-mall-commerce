import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from './types';

/**
 * Fakes a successful provider with no real charge, transfer, or account.
 * Selected automatically when STRIPE_SECRET_KEY isn't set (see index.ts),
 * letting the whole checkout flow be exercised end to end without a Stripe
 * account. `verifyWebhook` always returns null: the mock flow never receives
 * a real webhook, order creation happens via order-service's
 * `confirm-mock-payment` route instead, which is gated to only work when
 * this provider is active.
 */
export const mockProvider: PaymentProvider = {
  name: 'mock',

  async createConnectedAccount() {
    return { accountId: `acct_mock_${randomUUID()}` };
  },

  async createOnboardingLink({ returnUrl }) {
    return { url: returnUrl };
  },

  async createCheckoutIntent() {
    return { intentId: `pi_mock_${randomUUID()}`, clientSecret: null };
  },

  async createTransfer() {
    return { transferId: `tr_mock_${randomUUID()}` };
  },

  verifyWebhook() {
    return null;
  },
};
