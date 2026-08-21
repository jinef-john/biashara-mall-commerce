'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './api';

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
    queryKey: ['seller-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/seller/api/seller-notifications');
      return data.notifications;
    },
    enabled: options?.enabled ?? true,
    retry: false,
  });
}
