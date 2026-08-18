'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { useApi } from '../../../lib/api';
import { useCheckoutSession } from '../../../lib/use-checkout';
import { formatPrice } from '../../../lib/format';
import { CouponInput } from './coupon-input';
import { MockPaymentButton } from './mock-payment-button';
import { StripeCheckoutForm } from './stripe-checkout-form';

function CheckoutSkeleton() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 lg:grid-cols-2">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function CheckoutError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <AlertTriangle className="size-8 text-error" />
      <h1 className="text-headline-sm text-on-surface">{message}</h1>
      <Button asChild variant="outline">
        <Link href="/cart">Back to cart</Link>
      </Button>
    </main>
  );
}

function StripeSection({ sessionId, total }: { sessionId: string; total: number }) {
  const api = useApi();

  const { data, isPending, isError } = useQuery<{ clientSecret: string | null }>({
    queryKey: ['payment-intent', sessionId],
    queryFn: async () => {
      const { data } = await api.post('/order/api/create-payment-intent', { sessionId });
      return data;
    },
  });

  if (isPending) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isError || !data?.clientSecret) {
    return (
      <p className="text-body-sm text-error">
        Could not start the payment. Try again in a moment.
      </p>
    );
  }

  return <StripeCheckoutForm clientSecret={data.clientSecret} total={total} />;
}

export function CheckoutContent() {
  const sessionId = useSearchParams().get('sessionId');

  const { data, isPending, isError } = useCheckoutSession(sessionId);

  if (!sessionId) {
    return <CheckoutError message="No checkout session. Start from your cart." />;
  }
  if (isPending) return <CheckoutSkeleton />;
  if (isError || !data) {
    return <CheckoutError message="This checkout session has expired." />;
  }

  const { session, provider } = data;
  const address = session.shippingAddress;

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-body-lg font-medium text-on-surface">Order summary</h2>
          <div className="mt-4 flex flex-col gap-3 divide-y divide-outline-variant">
            {session.cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3 pt-3 first:pt-0"
              >
                <div className="flex flex-col">
                  <span className="text-body-sm text-on-surface">{item.title}</span>
                  <span className="text-label-sm text-on-surface-variant">
                    Qty {item.quantity}
                    {item.selectedOptions?.size ? ` · ${item.selectedOptions.size}` : ''}
                  </span>
                </div>
                <span className="text-body-sm text-on-surface tabular-nums">
                  {formatPrice(item.salePrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-outline-variant pt-4 text-body-md">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="text-on-surface tabular-nums">
                {formatPrice(session.subtotal)}
              </span>
            </div>
            {session.discount && (
              <div className="flex items-center justify-between text-secondary">
                <span>Discount</span>
                <span className="tabular-nums">
                  −{formatPrice(session.discount.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-body-lg font-medium">
              <span className="text-on-surface">Total</span>
              <span className="text-on-surface tabular-nums">
                {formatPrice(session.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-body-lg font-medium text-on-surface">Discount code</h2>
          <div className="mt-3">
            <CouponInput sessionId={session.sessionId} session={session} />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-body-lg font-medium text-on-surface">Shipping to</h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            {address.name}, {address.street}, {address.city} {address.zip}, {address.country}
          </p>
        </div>
      </div>

      <div className="h-fit rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
        <h2 className="text-body-lg font-medium text-on-surface">Payment</h2>
        <div className="mt-4">
          {provider === 'mock' ? (
            <MockPaymentButton sessionId={session.sessionId} total={session.total} />
          ) : (
            <StripeSection sessionId={session.sessionId} total={session.total} />
          )}
        </div>
      </div>
    </main>
  );
}
