'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import type { OrderStatusStep } from '@biashara-mall/config';
import { useApi } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { OrderStatusBadge } from './order-status-badge';
import { OrderListSkeleton } from './skeletons';

interface OrderListItem {
  id: string;
  total: number;
  status: OrderStatusStep;
  createdAt: string;
  items: { title: string; quantity: number }[];
  shop: { name: string; logoUrl: string | null };
}

export function OrdersSection() {
  const api = useApi();

  const { data: orders, isPending } = useQuery<OrderListItem[]>({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const { data } = await api.get('/order/api/get-user-orders');
      return data.orders;
    },
  });

  if (isPending) return <OrderListSkeleton />;

  const total = orders?.length ?? 0;
  const completed = orders?.filter((o) => o.status === 'delivered').length ?? 0;
  const processing = total - completed;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
          <p className="text-headline-sm text-on-surface">{total}</p>
          <p className="text-body-sm text-on-surface-variant">Total</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
          <p className="text-headline-sm text-primary">{processing}</p>
          <p className="text-body-sm text-on-surface-variant">Processing</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
          <p className="text-headline-sm text-secondary">{completed}</p>
          <p className="text-body-sm text-on-surface-variant">Completed</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline px-6 py-12 text-center">
          <Package className="size-8 text-on-surface-variant" />
          <p className="text-body-md text-on-surface">No orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders!.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-body-sm text-on-surface-variant">
                    #{order.id.slice(-8)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 truncate text-body-md text-on-surface">
                  {order.shop.name} &middot;{' '}
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 text-body-lg font-medium text-on-surface">
                {formatPrice(order.total)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
