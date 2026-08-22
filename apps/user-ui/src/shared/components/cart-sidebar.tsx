'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useStore } from '../../store';
import { useCartActions } from '../hooks/use-cart-actions';
import { formatPrice } from '../../lib/format';
import { useIsSuspended } from '../../lib/use-me';

export function CartSidebar() {
  const pathname = usePathname();
  const cart = useStore((s) => s.cart);
  const setQuantity = useStore((s) => s.setQuantity);
  const { removeFromCart } = useCartActions();
  const suspended = useIsSuspended();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  if (suspended || cart.length === 0 || pathname === '/cart') return null;

  return (
    <aside className="sticky top-0 hidden h-screen w-50 shrink-0 flex-col border-l border-outline-variant bg-surface-container-lowest lg:flex">
      <div className="flex flex-col gap-2 border-b border-outline-variant p-3">
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="font-medium text-error tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/cart">Go to cart</Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outline-variant [&::-webkit-scrollbar-track]:bg-transparent">
        {cart.map((item) => (
          <div key={item.id} className="flex gap-2">
            <Link
              href={`/product/${item.slug}`}
              className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-container"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link
                href={`/product/${item.slug}`}
                className="line-clamp-2 text-label-sm text-on-surface hover:underline"
              >
                {item.title}
              </Link>
              <span className="text-label-sm text-on-surface-variant">
                {formatPrice(item.price)}
              </span>

              <div className="mt-1 flex items-center justify-center rounded-lg border border-outline-variant">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    item.quantity === 1
                      ? `Remove ${item.title}`
                      : 'Decrease quantity'
                  }
                  onClick={() =>
                    item.quantity === 1
                      ? removeFromCart(item.id)
                      : setQuantity(item.id, item.quantity - 1)
                  }
                  className={
                    item.quantity === 1
                      ? 'text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                      : undefined
                  }
                >
                  {item.quantity === 1 ? <Trash2 /> : <Minus />}
                </Button>
                <span className="w-5 text-center text-label-sm tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(item.id, item.quantity + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
