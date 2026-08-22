'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Minus, Plus, ShoppingBag, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useStore, type LineItem } from '../../store';
import { useCartActions } from '../../shared/hooks/use-cart-actions';
import { useApi } from '../../lib/api';
import { cartToPayload } from '../../lib/use-checkout';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { AddressFormDialog } from '../../shared/components/address-form-dialog';
import { formatPrice } from '../../lib/format';

interface ShopGroup {
  shopId: string;
  shopName: string;
  items: LineItem[];
}

function groupByShop(cart: LineItem[]): ShopGroup[] {
  const groups = new Map<string, ShopGroup>();
  for (const item of cart) {
    const shopId = item.shopId ?? 'unknown';
    const shopName = item.shopName ?? 'Other';
    if (!groups.has(shopId)) groups.set(shopId, { shopId, shopName, items: [] });
    groups.get(shopId)!.items.push(item);
  }
  return [...groups.values()];
}

export default function CartPage() {
  const router = useRouter();
  const api = useApi();
  const cart = useStore((s) => s.cart);
  const setQuantity = useStore((s) => s.setQuantity);
  const clearCart = useStore((s) => s.clearCart);
  const { removeFromCart } = useCartActions();
  const [confirmClear, setConfirmClear] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);

  const groups = useMemo(() => groupByShop(cart), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const checkout = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/order/api/create-payment-session', {
        cart: cartToPayload(cart),
      });
      return data as { sessionId: string };
    },
    onSuccess: ({ sessionId }) => {
      router.push(`/checkout?sessionId=${sessionId}`);
    },
    onError: (err) => {
      const data = (
        err as { response?: { data?: { code?: string; message?: string } } }
      )?.response?.data;
      if (data?.code === 'NO_ADDRESS') {
        setAddressOpen(true);
        return;
      }
      toast.error(data?.message ?? 'Could not start checkout');
    },
  });

  if (cart.length === 0) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-16 text-center">
        <ShoppingBag className="size-10 text-on-surface-variant" />
        <h1 className="text-headline-lg text-on-surface">Your cart is empty</h1>
        <p className="text-body-md text-on-surface-variant">
          Add products to your cart to see them here.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-on-surface">Cart</h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirmClear(true)}
        >
          Clear cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {groups.map((group) => (
            <div
              key={group.shopId}
              className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              <Link
                href={group.shopId === 'unknown' ? '#' : `/shop/${group.shopId}`}
                className="flex w-fit items-center gap-2 text-label-md text-on-surface hover:text-primary"
              >
                <Store className="size-4" />
                {group.shopName}
              </Link>

              <div className="flex flex-col gap-4 divide-y divide-outline-variant">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 pt-4 first:pt-0"
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
                      {(item.color || item.size) && (
                        <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                          {item.color && (
                            <span
                              className="size-3.5 rounded-full border border-outline-variant"
                              style={{ backgroundColor: item.color }}
                              title={item.color}
                            />
                          )}
                          {item.size && <span>{item.size}</span>}
                        </div>
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
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
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
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>

                    <span className="w-20 text-right text-body-md text-on-surface tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeFromCart(item.id)}
                      className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="text-body-lg font-medium text-on-surface">
            Order summary
          </h2>
          <div className="mt-4 flex items-center justify-between text-body-md">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="text-on-surface tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-4 text-body-lg font-medium">
            <span className="text-on-surface">Total</span>
            <span className="text-on-surface tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending ? 'Starting checkout…' : 'Proceed to Checkout'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear your cart?"
        description={`This removes all ${cart.length} item${cart.length === 1 ? '' : 's'} from your cart. This can't be undone.`}
        confirmLabel="Clear cart"
        destructive
        onConfirm={() => {
          clearCart();
          setConfirmClear(false);
        }}
      />

      <AddressFormDialog
        open={addressOpen}
        onOpenChange={setAddressOpen}
        onSaved={() => checkout.mutate()}
        forceDefault
      />
    </main>
  );
}
