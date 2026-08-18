'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../../../lib/api';
import { formatPrice } from '../../../lib/format';

/** Stands in for the Stripe Elements form when no payment provider is
 * configured. Confirms the order instantly through order-service's
 * mock-only route instead of a real charge. The cart is cleared on the
 * success page itself, not here. The real Stripe path does a hard browser
 * redirect straight past this component, so it's the one place guaranteed
 * to run for both flows. */
export function MockPaymentButton({ sessionId, total }: { sessionId: string; total: number }) {
  const router = useRouter();
  const api = useApi();

  const confirm = useMutation({
    mutationFn: () => api.post('/order/api/confirm-mock-payment', { sessionId }),
    onSuccess: () => {
      router.push(`/payment-success?sessionId=${sessionId}`);
    },
    onError: () => toast.error('Could not confirm the order'),
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        className="w-full"
        disabled={confirm.isPending}
        onClick={() => confirm.mutate()}
      >
        {confirm.isPending ? 'Placing order…' : `Pay ${formatPrice(total)} now (test mode)`}
      </Button>
      <p className="text-center text-label-sm text-on-surface-variant">
        No payment provider is configured. This places the order without a
        real charge.
      </p>
    </div>
  );
}
