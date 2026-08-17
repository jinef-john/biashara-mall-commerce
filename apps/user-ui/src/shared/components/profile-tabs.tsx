'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@biashara-mall/ui/components/ui/tabs';
import { AddressSection } from './address-section';
import { OrdersSection } from './orders-section';

const TABS = ['orders', 'addresses'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab);
}

export function ProfileTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('active');
  const tab: Tab = isTab(active) ? active : 'orders';

  return (
    <Tabs value={tab} onValueChange={(value) => router.replace(`/profile?active=${value}`)}>
      <TabsList>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="pt-4">
        <OrdersSection />
      </TabsContent>
      <TabsContent value="addresses" className="pt-4">
        <AddressSection />
      </TabsContent>
    </Tabs>
  );
}
