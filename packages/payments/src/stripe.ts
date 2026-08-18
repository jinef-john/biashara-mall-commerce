import Stripe from 'stripe';
import type { PaymentProvider } from './types';

let client: Stripe | null = null;

function getClient(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(key);
  }
  return client;
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createConnectedAccount({ email, country }) {
    const account = await getClient().accounts.create({
      type: 'express',
      email,
      country,
    });
    return { accountId: account.id };
  },

  async createOnboardingLink({ accountId, refreshUrl, returnUrl }) {
    const link = await getClient().accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return { url: link.url };
  },

  async createCheckoutIntent({
    amount,
    currency,
    platformFeeBps,
    destinationAccountId,
    metadata,
  }) {
    const amountMinor = Math.round(amount * 100);
    const intent = await getClient().paymentIntents.create({
      amount: amountMinor,
      currency,
      metadata,
      // Single-shop carts use a destination charge: Stripe settles the
      // seller's 90% automatically. Multi-shop carts omit this: funds land
      // on the platform account and get split via createTransfer once the
      // order-creation webhook fires, since one PaymentIntent can only name
      // one destination.
      ...(destinationAccountId && {
        application_fee_amount: Math.round(amountMinor * (platformFeeBps / 10000)),
        transfer_data: { destination: destinationAccountId },
      }),
    });
    return { intentId: intent.id, clientSecret: intent.client_secret };
  },

  async createTransfer({ amount, currency, destinationAccountId, metadata }) {
    const transfer = await getClient().transfers.create({
      amount: Math.round(amount * 100),
      currency,
      destination: destinationAccountId,
      metadata,
    });
    return { transferId: transfer.id };
  },

  verifyWebhook(rawBody, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) return null;

    try {
      const event = getClient().webhooks.constructEvent(rawBody, signature, secret);
      if (event.type !== 'payment_intent.succeeded') return null;
      const intent = event.data.object as Stripe.PaymentIntent;
      return {
        type: 'payment_intent.succeeded',
        intentId: intent.id,
        metadata: intent.metadata as Record<string, string>,
      };
    } catch {
      return null;
    }
  },
};
