'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useApi } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { TableSkeleton } from '../../../components/skeletons';
import { Pagination } from '../../../components/pagination';
import { OrderStatusBadge } from '../../../components/order-status-badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';
import type { OrderStatusStep } from '@biashara-mall/config';

interface OrderListItem {
  id: string;
  total: number;
  status: OrderStatusStep;
  createdAt: string;
  items: { quantity: number }[];
  user: { name: string | null; email: string };
  shop: { name: string };
}

interface OrdersResponse {
  orders: OrderListItem[];
  pagination: { total: number; page: number; totalPages: number };
}

export default function AdminOrdersPage() {
  const api = useApi();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', page, q],
    queryFn: async () => {
      const { data } = await api.get('/order/api/get-admin-orders', {
        params: { page, ...(q ? { q } : {}) },
      });
      return data;
    },
  });

  const orders = data?.orders ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Orders</h1>
        <p className="text-body-md text-on-surface-variant">
          Every order placed across the platform.
        </p>
      </div>

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(search.trim());
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by buyer name or email"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load orders. The order service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton
          columns={['Order', 'Buyer', 'Shop', 'Items', 'Total', 'Status', 'Placed', '']}
        />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {q ? 'No orders match that search.' : 'No orders yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="w-36">Shop</TableHead>
                <TableHead className="w-16 text-right">Items</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead className="w-28">Placed</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell
                    className="truncate font-mono text-on-surface-variant"
                    title={order.id}
                  >
                    #{order.id.slice(-8)}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <span className="truncate text-on-surface" title={order.user.email}>
                      {order.user.name ?? order.user.email}
                    </span>
                  </TableCell>
                  <TableCell
                    className="truncate text-on-surface-variant"
                    title={order.shop.name}
                  >
                    {order.shop.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface">
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface">
                    {formatMoney(order.total)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon-sm" className="text-on-surface-variant">
                      <Link href={`/dashboard/orders/${order.id}`} aria-label="View order" title="View order">
                        <Eye />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
