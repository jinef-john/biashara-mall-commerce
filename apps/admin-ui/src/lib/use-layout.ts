'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './api';

export interface Layout {
  logoUrl: string | null;
  bannerUrl: string | null;
}

export function useLayout() {
  const api = useApi();
  return useQuery<Layout>({
    queryKey: ['layout'],
    queryFn: async () => {
      const { data } = await api.get('/user/api/get-layouts');
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}
