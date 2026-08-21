'use client';

import { useMe } from '../lib/use-me';
import { WebSocketProvider } from '../context/web-socket-context';

// Split from the layout so the layout can stay a server component: the socket
// can't connect until useMe resolves the Mongo id the handshake needs.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useMe();
  return <WebSocketProvider handshakeId={me?.id ?? null}>{children}</WebSocketProvider>;
}
