'use client';

import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@biashara-mall/ui/components/ui/chart';

export interface SalesChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-primary)' },
  orders: { label: 'Orders', color: 'var(--color-secondary)' },
} satisfies ChartConfig;

export function SalesChart({ data }: { data: SalesChartPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <ComposedChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          }
        />
        <YAxis yAxisId="revenue" tickLine={false} axisLine={false} tickMargin={8} width={40} />
        <YAxis yAxisId="orders" orientation="right" tickLine={false} axisLine={false} tickMargin={8} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          yAxisId="revenue"
          dataKey="revenue"
          type="monotone"
          fill="var(--color-revenue)"
          fillOpacity={0.2}
          stroke="var(--color-revenue)"
        />
        <Bar yAxisId="orders" dataKey="orders" fill="var(--color-orders)" radius={2} barSize={6} />
      </ComposedChart>
    </ChartContainer>
  );
}
