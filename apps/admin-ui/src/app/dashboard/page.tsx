'use client';

import { useQuery } from '@tanstack/react-query';
import { CircleDollarSign, ShoppingBag, Store, Users } from 'lucide-react';
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

interface AdminOrderStats {
  daily: SalesChartPoint[];
  countries: GeoMapPoint[];
  totals: { orders: number; revenue: number; shops: number; users: number };
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
            <Skeleton className="mb-1 h-7 w-16" />
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

  const { data: stats, isPending, isError, refetch } = useQuery<AdminOrderStats>({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      const { data } = await api.get('/order/api/get-admin-order-stats');
      return data;
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant">
          How the platform is doing at a glance.
        </p>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load dashboard stats. The order service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Shops"
              value={stats?.totals.shops ?? 0}
              icon={Store}
              loading={isPending}
            />
            <StatCard
              label="Users"
              value={stats?.totals.users ?? 0}
              icon={Users}
              loading={isPending}
            />
            <StatCard
              label="Orders, last 30 days"
              value={stats?.totals.orders ?? 0}
              icon={ShoppingBag}
              loading={isPending}
            />
            <StatCard
              label="Revenue, last 30 days"
              value={
                isPending
                  ? 0
                  : (stats?.totals.revenue ?? 0).toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    })
              }
              icon={CircleDollarSign}
              loading={isPending}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales, last 30 days</CardTitle>
                <CardDescription>Platform-wide revenue and order volume.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPending ? (
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
                {isPending ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <GeoMap data={stats?.countries ?? []} />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
