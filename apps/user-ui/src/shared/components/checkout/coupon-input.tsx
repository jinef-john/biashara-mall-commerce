'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { useApi } from '../../../lib/api';
import type { CheckoutSession } from '../../../lib/use-checkout';

export function CouponInput({ sessionId, session }: { sessionId: string; session: CheckoutSession }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['checkout-session', sessionId] });

  const apply = useMutation({
    mutationFn: () =>
      api.put('/order/api/verify-coupon', { sessionId, code: code.trim() }),
    onSuccess: () => {
      setCode('');
      invalidate();
      toast.success('Coupon applied');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'That code did not work';
      toast.error(message);
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/order/api/verify-coupon', { data: { sessionId } }),
    onSuccess: () => {
      invalidate();
      toast.success('Coupon removed');
    },
  });

  if (session.discount) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container px-3 py-2">
        <Badge variant="secondary" className="font-mono">
          {session.couponCode}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove coupon"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) apply.mutate();
      }}
      className="flex gap-2"
    >
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Discount code"
        className="flex-1 font-mono uppercase"
      />
      <Button type="submit" variant="outline" disabled={apply.isPending || !code.trim()}>
        {apply.isPending ? 'Applying…' : 'Apply'}
      </Button>
    </form>
  );
}
