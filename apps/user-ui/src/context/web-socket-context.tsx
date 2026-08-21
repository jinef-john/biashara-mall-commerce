'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const SOCKET_URI = process.env.NEXT_PUBLIC_CHATTING_SOCKET_URI ?? 'ws://localhost:6006';
const RECONNECT_DELAY_MS = 3000;

export interface ChatMessage {
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'seller';
  content: string;
  attachments: string[];
  createdAt: string;
}

interface SendArgs {
  conversationId: string;
  toUserId: string;
  messageBody: string;
  attachments?: string[];
}

interface WebSocketValue {
  ready: boolean;
  unreadCounts: Record<string, number>;
  sendMessage: (args: SendArgs) => void;
  markAsSeen: (conversationId: string) => void;
  subscribe: (listener: (message: ChatMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketValue | null>(null);

export function WebSocketProvider({
  handshakeId,
  children,
}: {
  handshakeId: string | null;
  children: React.ReactNode;
}) {
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<(message: ChatMessage) => void>());
  const [ready, setReady] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!handshakeId) return;
    let socket: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(SOCKET_URI);
      socketRef.current = socket;

      socket.onopen = () => {
        socket.send(`user_${handshakeId}`);
        setReady(true);
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'NEW_MESSAGE') {
          listenersRef.current.forEach((listener) => listener(payload.message));
        } else if (payload.type === 'UNSEEN_COUNT_UPDATE') {
          setUnreadCounts((current) => ({
            ...current,
            [payload.conversationId]: payload.count,
          }));
        }
      };

      socket.onclose = () => {
        setReady(false);
        if (!closed) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [handshakeId]);

  const send = (payload: unknown) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  };

  const sendMessage = useCallback(
    ({ conversationId, toUserId, messageBody, attachments }: SendArgs) => {
      send({
        conversationId,
        toUserId,
        messageBody,
        senderType: 'user',
        attachments: attachments ?? [],
      });
    },
    [],
  );

  const markAsSeen = useCallback((conversationId: string) => {
    send({ type: 'MARK_AS_SEEN', conversationId });
  }, []);

  const subscribe = useCallback((listener: (message: ChatMessage) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{ ready, unreadCounts, sendMessage, markAsSeen, subscribe }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketValue {
  const value = useContext(WebSocketContext);
  if (!value) throw new Error('useWebSocket must be used inside a WebSocketProvider');
  return value;
}
