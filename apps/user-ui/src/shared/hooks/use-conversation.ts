'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../lib/api';
import { useWebSocket, type ChatMessage } from '../../context/web-socket-context';

// REST returns newest-first (10/page); the pane renders oldest-first.
export function useConversation(conversationId: string | null, endpoint: string) {
  const api = useApi();
  const { subscribe } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPage = useCallback(
    async (target: number) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const { data } = await api.get(`${endpoint}/${conversationId}?page=${target}`);
        const ordered = [...data.messages].reverse();
        setMessages((current) => (target === 1 ? ordered : [...ordered, ...current]));
        setHasMore(data.pagination.hasMore);
        setPage(target);
      } finally {
        setLoading(false);
      }
    },
    [api, conversationId, endpoint],
  );

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    if (conversationId) fetchPage(1);
  }, [conversationId, fetchPage]);

  // The socket echo is the only thing that appends a sent message, so a
  // message can't render twice.
  useEffect(
    () =>
      subscribe((message) => {
        if (message.conversationId !== conversationId) return;
        setMessages((current) => [...current, message]);
      }),
    [subscribe, conversationId],
  );

  return {
    messages,
    hasMore,
    loading,
    loadPrevious: () => fetchPage(page + 1),
  };
}
