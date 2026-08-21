'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../lib/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  redirectLink: string | null;
  status: 'unread' | 'read';
  createdAt: string;
}

export function useNotifications(options?: { enabled?: boolean }) {
  const api = useApi();
  return useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/user/api/notifications');
      return data.notifications;
    },
    enabled: options?.enabled ?? true,
  });
}
