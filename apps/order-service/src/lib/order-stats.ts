interface StatsOrder {
  createdAt: Date;
  total: number;
  paymentStatus: string;
  shippingAddress: { country: string };
}

export interface OrderStats {
  daily: { date: string; revenue: number; orders: number }[];
  countries: { country: string; orders: number; revenue: number }[];
  totals: { orders: number; revenue: number; shops?: number; users?: number };
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function buildOrderStats(orders: StatsOrder[], days: number): OrderStats {
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dailyMap.set(dateKey(d), { revenue: 0, orders: 0 });
  }

  const countryMap = new Map<string, { orders: number; revenue: number }>();
  let totalOrders = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    const key = dateKey(order.createdAt);
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.orders += 1;
      if (order.paymentStatus === 'paid') bucket.revenue += order.total;
    }

    const country = order.shippingAddress.country;
    const countryBucket = countryMap.get(country) ?? { orders: 0, revenue: 0 };
    countryBucket.orders += 1;
    if (order.paymentStatus === 'paid') countryBucket.revenue += order.total;
    countryMap.set(country, countryBucket);

    totalOrders += 1;
    if (order.paymentStatus === 'paid') totalRevenue += order.total;
  }

  return {
    daily: Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v })),
    countries: Array.from(countryMap.entries())
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.orders - a.orders),
    totals: { orders: totalOrders, revenue: totalRevenue },
  };
}
