'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../lib/api';
import { WebSocketProvider } from '../context/web-socket-context';

// Handshakes as seller_<Shops.id>, so the socket waits on the shop lookup the
// dashboard already performs.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const { data: shop } = useQuery<{ id: string } | null>({
    queryKey: ['shop-me'],
    queryFn: async () => {
      const { data } = await api.get('/seller/api/shops/me');
      return data.shop;
    },
    staleTime: 60_000,
  });

  return <WebSocketProvider handshakeId={shop?.id ?? null}>{children}</WebSocketProvider>;
}
