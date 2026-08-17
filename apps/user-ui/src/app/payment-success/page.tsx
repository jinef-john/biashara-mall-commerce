'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useStore } from '../../store';

export default function PaymentSuccessPage() {
  const clearCart = useStore((s) => s.clearCart);

  // Runs once on arrival regardless of how we got here (mock confirm's
  // client-side push, or Stripe's hard redirect after 3D Secure).
  useEffect(() => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    clearCart();
  }, [clearCart]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <CheckCircle2 className="size-14 text-secondary" />
      <h1 className="text-headline-lg text-on-surface">Order placed!</h1>
      <p className="text-body-md text-on-surface-variant">
        Thanks for shopping with Biashara Mall. Your order confirmation is on
        its way.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link href="/profile">Track Order</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Keep shopping</Link>
        </Button>
      </div>
    </main>
  );
}
