'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarRange,
  Package,
  PackagePlus,
  Settings,
  TicketPercent,
  Trash2,
} from 'lucide-react';
import { useApi } from '../../lib/api';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@biashara-mall/ui/components/ui/card';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { SalesChart, type SalesChartPoint } from '@biashara-mall/ui/components/charts/sales-chart';
import { GeoMap, type GeoMapPoint } from '@biashara-mall/ui/components/charts/geo-map';

interface OrderStats {
  daily: SalesChartPoint[];
  countries: GeoMapPoint[];
  totals: { orders: number; revenue: number };
}

interface ProductRow {
  id: string;
  isDeleted: boolean;
  startingDate: string | null;
  stock: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary-container">
          <Icon className="size-5 text-on-primary-container" />
        </div>
        <div>
          {loading ? (
            <Skeleton className="mb-1 h-7 w-12" />
          ) : (
            <p className="text-headline-md text-on-surface tabular-nums">
              {value}
            </p>
          )}
          <p className="text-body-sm text-on-surface-variant">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const api = useApi();

  const { data: products, isPending } = useQuery<ProductRow[]>({
    queryKey: ['products', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/products', {
        params: { includeDeleted: 'true' },
      });
      return data.products;
    },
  });

  const { data: codes } = useQuery<unknown[]>({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/discount-codes');
      return data.discountCodes;
    },
  });

  const { data: stats, isPending: statsPending } = useQuery<OrderStats>({
    queryKey: ['seller-order-stats'],
    queryFn: async () => {
      const { data } = await api.get('/order/api/get-seller-order-stats');
      return data;
    },
  });

  const live = (products ?? []).filter((p) => !p.isDeleted);
  const activeProducts = live.filter((p) => !p.startingDate).length;
  const activeEvents = live.filter((p) => p.startingDate).length;
  const deleted = (products ?? []).filter((p) => p.isDeleted).length;
  const lowStock = live.filter((p) => p.stock <= 5).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant">
          How your shop is doing at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active products"
          value={activeProducts}
          icon={Package}
          loading={isPending}
        />
        <StatCard
          label="Events"
          value={activeEvents}
          icon={CalendarRange}
          loading={isPending}
        />
        <StatCard
          label="Discount codes"
          value={codes?.length ?? 0}
          icon={TicketPercent}
          loading={isPending}
        />
        <StatCard
          label="In deleted state"
          value={deleted}
          icon={Trash2}
          loading={isPending}
        />
      </div>

      {lowStock > 0 && (
        <div className="rounded-lg border border-outline-variant bg-tertiary-container/40 px-4 py-3">
          <p className="text-body-sm text-on-surface">
            {lowStock} product{lowStock === 1 ? '' : 's'} running low on stock
            (5 or fewer left).
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump straight to the common tasks.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/create-product">
              <PackagePlus />
              New product
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/events/create">
              <CalendarRange />
              New event
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/discount-codes">
              <TicketPercent />
              Discount codes
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <Settings />
              Shop settings
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales, last 30 days</CardTitle>
            <CardDescription>
              {statsPending
                ? 'Loading…'
                : `${stats?.totals.orders ?? 0} orders, ${(stats?.totals.revenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} revenue`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <SalesChart data={stats?.daily ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where orders ship to</CardTitle>
            <CardDescription>Order volume by country, last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {statsPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <GeoMap data={stats?.countries ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
