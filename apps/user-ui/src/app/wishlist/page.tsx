'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useStore, type LineItem } from '../../store';
import { useCartActions } from '../../shared/hooks/use-cart-actions';
import { formatPrice } from '../../lib/format';
import { SuspendedGate } from '../../shared/components/suspended-gate';

function WishlistPage() {
  const wishlist = useStore((s) => s.wishlist);
  const setQuantity = useStore((s) => s.setQuantity);
  const { addToCart, removeFromWishlist } = useCartActions();

  const moveToCart = (item: LineItem) => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  if (wishlist.length === 0) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-headline-lg text-on-surface">
          Your wishlist is empty
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Save products you like to find them here later.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <h1 className="text-headline-lg text-on-surface">Wishlist</h1>

      <div className="flex flex-col gap-3">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <Link
              href={`/product/${item.slug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-surface-container"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={`/product/${item.slug}`}
                className="line-clamp-1 text-body-md text-on-surface hover:underline"
              >
                {item.title}
              </Link>
              {item.shopName && (
                <span className="text-label-sm text-on-surface-variant">
                  {item.shopName}
                </span>
              )}
              <span className="text-body-md font-medium text-on-surface">
                {formatPrice(item.price)}
              </span>
            </div>

            <div className="flex items-center rounded-lg border border-outline-variant">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                onClick={() =>
                  setQuantity(item.id, item.quantity - 1, 'wishlist')
                }
              >
                <Minus />
              </Button>
              <span className="w-8 text-center text-body-md tabular-nums">
                {item.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity(item.id, item.quantity + 1, 'wishlist')
                }
              >
                <Plus />
              </Button>
            </div>

            <Button type="button" variant="outline" onClick={() => moveToCart(item)}>
              <ShoppingCart />
              Move to cart
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${item.title}`}
              onClick={() => removeFromWishlist(item.id)}
              className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <SuspendedGate>
      <WishlistPage />
    </SuspendedGate>
  );
}
