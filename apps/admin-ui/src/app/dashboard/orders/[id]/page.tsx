'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import type { OrderStatusStep } from '@biashara-mall/config';
import { useApi } from '../../../../lib/api';
import { formatMoney } from '../../../../lib/format';
import { OrderStatusBadge } from '../../../../components/order-status-badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@biashara-mall/ui/components/ui/card';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';

interface OrderDetails {
  id: string;
  status: OrderStatusStep;
  total: number;
  discountAmount: number;
  platformFee: number;
  couponCode: string | null;
  createdAt: string;
  shippingAddress: { name: string; street: string; city: string; zip: string; country: string };
  buyer: { name: string | null; email: string } | null;
  shop: { name: string; logoUrl: string | null } | null;
  items: {
    productId: string;
    title: string;
    quantity: number;
    salePrice: number;
    product: { id: string; slug: string; images: { fileUrl: string }[] } | null;
  }[];
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const api = useApi();

  const { data, isPending, isError } = useQuery<OrderDetails>({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/order/api/get-order-details/${id}`);
      return data.order;
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-error bg-error-container px-4 py-3">
        <p className="text-body-sm text-on-error-container">Could not load this order.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/dashboard/orders" aria-label="Back to orders">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="font-mono text-headline-md text-on-surface">#{data.id.slice(-8)}</h1>
          <p className="text-body-sm text-on-surface-variant">
            Placed {new Date(data.createdAt).toLocaleString()}
            {data.shop && ` · Sold by ${data.shop.name}`}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={data.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-title-md">Items</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
                <p className="truncate text-body-md text-on-surface" title={item.title}>
                  {item.title}
                </p>
                <p className="text-body-sm text-on-surface-variant">Qty {item.quantity}</p>
              </div>
              <span className="tabular-nums text-on-surface">
                {formatMoney(item.salePrice * item.quantity)}
              </span>
            </div>
          ))}

          <div className="mt-2 flex flex-col gap-1 border-t border-outline-variant pt-3 text-body-sm">
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Discount {data.couponCode ? `(${data.couponCode})` : ''}</span>
                <span>-{formatMoney(data.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-on-surface">
              <span>Order total</span>
              <span>{formatMoney(data.total)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Platform fee</span>
              <span>{formatMoney(data.platformFee)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-title-md">Deliver to</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-body-md text-on-surface">
          <p className="font-medium">{data.shippingAddress.name}</p>
          {data.buyer && (
            <p className="text-body-sm text-on-surface-variant">
              {data.buyer.name ?? data.buyer.email}
            </p>
          )}
          <p className="text-on-surface-variant">
            {data.shippingAddress.street}, {data.shippingAddress.city}{' '}
            {data.shippingAddress.zip}, {data.shippingAddress.country}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
