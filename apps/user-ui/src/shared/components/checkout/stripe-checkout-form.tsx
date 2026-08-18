'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { formatPrice } from '../../../lib/format';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function PayButton({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setSubmitting(false);
    }
    // On success Stripe redirects to return_url: nothing else to do here.
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-body-sm text-error">{error}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full">
        {submitting ? 'Processing…' : `Pay ${formatPrice(total)}`}
      </Button>
    </form>
  );
}

export function StripeCheckoutForm({
  clientSecret,
  total,
}: {
  clientSecret: string;
  total: number;
}) {
  if (!stripePromise) {
    return (
      <p className="text-body-sm text-error">
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PayButton total={total} />
    </Elements>
  );
}
