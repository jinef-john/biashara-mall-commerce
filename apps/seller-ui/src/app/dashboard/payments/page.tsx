'use client';

import { useQuery } from '@tanstack/react-query';
import { sellerEarning, type OrderStatusStep } from '@biashara-mall/config';
import { useApi } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { TableSkeleton } from '../../../components/skeletons';
import { OrderStatusBadge } from '../../../components/order-status-badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';

interface OrderListItem {
  id: string;
  total: number;
  platformFee: number;
  status: OrderStatusStep;
  createdAt: string;
  user: { name: string | null; email: string };
}

export default function PaymentsPage() {
  const api = useApi();

  const {
    data: orders,
    isPending,
    isError,
    refetch,
  } = useQuery<OrderListItem[]>({
    queryKey: ['seller-orders'],
    queryFn: async () => {
      const { data } = await api.get('/order/api/get-seller-orders');
      return data.orders;
    },
  });

  const totalEarned = (orders ?? []).reduce((sum, o) => sum + sellerEarning(o.total), 0);
  const totalFees = (orders ?? []).reduce((sum, o) => sum + o.platformFee, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Payments</h1>
        <p className="text-body-md text-on-surface-variant">
          Your earnings after the platform fee, order by order.
        </p>
      </div>

      {!isPending && !isError && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-body-sm text-on-surface-variant">Total earned</p>
            <p className="text-headline-sm text-secondary">{formatMoney(totalEarned)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-body-sm text-on-surface-variant">Platform fees paid</p>
            <p className="text-headline-sm text-on-surface">{formatMoney(totalFees)}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-body-sm text-on-surface-variant">Orders</p>
            <p className="text-headline-sm text-on-surface">{orders?.length ?? 0}</p>
          </div>
        </div>
      )}

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load payments. The order service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton
          columns={['Order', 'Buyer', 'Total', 'Platform fee (10%)', 'Your earning (90%)', 'Status']}
        />
      ) : orders?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Order</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-32 text-right">Platform fee</TableHead>
                <TableHead className="w-32 text-right">Your earning</TableHead>
                <TableHead className="w-40">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders!.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="truncate font-mono text-on-surface-variant" title={order.id}>
                    #{order.id.slice(-8)}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <span className="truncate text-on-surface" title={order.user.email}>
                      {order.user.name ?? order.user.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface">
                    {formatMoney(order.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface-variant">
                    -{formatMoney(order.platformFee)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-secondary">
                    {formatMoney(sellerEarning(order.total))}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
