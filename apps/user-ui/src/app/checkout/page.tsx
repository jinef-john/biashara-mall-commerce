import { Suspense } from 'react';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { CheckoutContent } from '../../shared/components/checkout/checkout-content';

export const metadata = {
  title: 'Checkout — Biashara Mall',
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
