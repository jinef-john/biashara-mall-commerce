export interface CreateConnectedAccountParams {
  email: string;
  country: string;
}

export interface CreateOnboardingLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export interface CreateCheckoutIntentParams {
  /** Major currency unit (dollars), not cents. */
  amount: number;
  currency: string;
  platformFeeBps: number;
  /** null when the cart spans more than one shop: no single destination
   * applies at intent-creation time, so funds land on the platform account
   * and get split via separate `createTransfer` calls after payment succeeds. */
  destinationAccountId: string | null;
  metadata: Record<string, string>;
}

export interface CheckoutIntentResult {
  intentId: string;
  /** null in mock mode: there's nothing for Stripe Elements to mount. */
  clientSecret: string | null;
}

export interface CreateTransferParams {
  amount: number;
  currency: string;
  destinationAccountId: string;
  metadata: Record<string, string>;
}

export interface NormalizedPaymentEvent {
  type: 'payment_intent.succeeded';
  intentId: string;
  metadata: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: 'stripe' | 'mock';
  createConnectedAccount(
    params: CreateConnectedAccountParams,
  ): Promise<{ accountId: string }>;
  createOnboardingLink(params: CreateOnboardingLinkParams): Promise<{ url: string }>;
  createCheckoutIntent(params: CreateCheckoutIntentParams): Promise<CheckoutIntentResult>;
  createTransfer(params: CreateTransferParams): Promise<{ transferId: string }>;
  /** Returns null on a missing/invalid signature, never throws. */
  verifyWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): NormalizedPaymentEvent | null;
}
