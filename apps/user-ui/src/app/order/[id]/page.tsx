'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import type { OrderStatusStep } from '@biashara-mall/config';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../../../lib/api';
import { formatPrice } from '../../../lib/format';
import { OrderStatusBadge } from '../../../shared/components/order-status-badge';
import { DeliveryProgress } from '../../../shared/components/delivery-progress';
import { OrderReviews } from '../../../shared/components/order-reviews';

interface OrderDetails {
  id: string;
  status: OrderStatusStep;
  total: number;
  discountAmount: number;
  couponCode: string | null;
  createdAt: string;
  shippingAddress: {
    label: string;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  shop: { name: string; logoUrl: string | null } | null;
  items: {
    productId: string;
    title: string;
    quantity: number;
    salePrice: number;
    product: { id: string; slug: string; images: { fileUrl: string }[] } | null;
  }[];
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const api = useApi();

  const { data, isPending, isError } = useQuery<OrderDetails>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/order/api/get-order-details/${id}`);
      return data.order;
    },
  });

  if (isPending) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load this order.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="font-mono text-headline-md text-on-surface">
            #{data.id.slice(-8)}
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Placed {new Date(data.createdAt).toLocaleString()}
            {data.shop ? ` · ${data.shop.name}` : ''}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={data.status} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <DeliveryProgress status={data.status} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <h2 className="text-title-md text-on-surface">Items</h2>
        {data.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3">
            {item.product?.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.product.images[0].fileUrl}
                alt=""
                className="size-12 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="size-12 shrink-0 rounded bg-surface-container" />
            )}
            <div className="min-w-0 flex-1">
              {item.product ? (
                <Link
                  href={`/product/${item.product.slug}`}
                  className="truncate text-body-md text-on-surface hover:underline"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="truncate text-body-md text-on-surface">
                  {item.title}
                </p>
              )}
              <p className="text-body-sm text-on-surface-variant">
                Qty {item.quantity}
              </p>
            </div>
            <span className="tabular-nums text-on-surface">
              {formatPrice(item.salePrice * item.quantity)}
            </span>
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-1 border-t border-outline-variant pt-3 text-body-sm">
          {data.discountAmount > 0 && (
            <div className="flex justify-between text-on-surface-variant">
              <span>
                Discount {data.couponCode ? `(${data.couponCode})` : ''}
              </span>
              <span>-{formatPrice(data.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-on-surface">
            <span>Total</span>
            <span>{formatPrice(data.total)}</span>
          </div>
        </div>
      </div>

      <OrderReviews orderId={data.id} />

      <div className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <h2 className="text-title-md text-on-surface">Delivery address</h2>
        <p className="text-body-md font-medium text-on-surface">
          {data.shippingAddress.name}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          {data.shippingAddress.street}, {data.shippingAddress.city}{' '}
          {data.shippingAddress.zip}, {data.shippingAddress.country}
        </p>
      </div>
    </main>
  );
}
