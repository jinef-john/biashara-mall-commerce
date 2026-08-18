'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@biashara-mall/ui/components/ui/sheet';
import { useStore } from '../../store';
import { useCartActions } from '../hooks/use-cart-actions';
import { formatPrice } from '../../lib/format';

export function CartDrawer() {
  const cart = useStore((s) => s.cart);
  const isOpen = useStore((s) => s.isCartOpen);
  const closeCart = useStore((s) => s.closeCart);
  const setQuantity = useStore((s) => s.setQuantity);
  const { removeFromCart } = useCartActions();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-outline-variant">
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="size-10 text-on-surface-variant" />
            <p className="text-body-md text-on-surface-variant">
              Your cart is empty.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Link
                  href={`/product/${item.slug}`}
                  onClick={closeCart}
                  className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-container"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="line-clamp-1 text-body-sm text-on-surface hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="text-body-sm font-medium text-on-surface">
                    {formatPrice(item.price)}
                  </span>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-outline-variant">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Decrease quantity"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-body-sm tabular-nums">
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

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeFromCart(item.id)}
                      className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <SheetFooter className="border-t border-outline-variant">
            <div className="flex items-center justify-between text-body-lg font-medium">
              <span className="text-on-surface">Subtotal</span>
              <span className="text-on-surface tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
            <SheetClose asChild>
              <Button asChild className="w-full">
                <Link href="/cart">View cart</Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Continue shopping
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
