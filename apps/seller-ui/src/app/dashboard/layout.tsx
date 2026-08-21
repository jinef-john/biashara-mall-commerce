'use client';

import { useQuery } from '@tanstack/react-query';
import { OctagonAlert } from 'lucide-react';
import { useApi } from '../../lib/api';
import { Sidebar } from '../../components/sidebar';
import { Header } from '../../components/header';
import { ChatProvider } from '../../components/chat-provider';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@biashara-mall/ui/components/ui/alert';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@biashara-mall/ui/components/ui/sidebar';
import { TooltipProvider } from '@biashara-mall/ui/components/ui/tooltip';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();

  const { data: shop } = useQuery<{ status: 'active' | 'banned' } | null>({
    queryKey: ['shop-me'],
    queryFn: async () => {
      const { data } = await api.get('/seller/api/shops/me');
      return data.shop;
    },
    staleTime: 60_000,
  });

  return (
    <TooltipProvider>
      <ChatProvider>
        <SidebarProvider className="flex-col">
          <Header leading={<SidebarTrigger />} />
          <div className="flex flex-1">
            <Sidebar />
            <SidebarInset className="bg-surface">
              <div className="flex-1 px-8 py-6">
                {shop?.status === 'banned' && (
                  <Alert variant="destructive" className="mb-6">
                    <OctagonAlert />
                    <AlertTitle>This shop has been suspended</AlertTitle>
                    <AlertDescription>
                      An admin has suspended your shop. It's hidden from buyers,
                      and you can't create or edit products until it's
                      reinstated.
                    </AlertDescription>
                  </Alert>
                )}
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ChatProvider>
    </TooltipProvider>
  );
}
