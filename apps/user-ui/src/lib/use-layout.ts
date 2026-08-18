'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi } from './api';

export interface Layout {
  logoUrl: string | null;
  bannerUrl: string | null;
}

/**
 * Narrower and shorter-cached than useSiteConfig (which is staleTime:
 * Infinity — a long-lived tab would never see a logo/banner change). This
 * hook exists so admin edits to storefront chrome propagate within an hour
 * instead of only on a fresh session.
 */
export function useLayout() {
  return useQuery<Layout>({
    queryKey: ['layout'],
    queryFn: async () => {
      const { data } = await publicApi.get('/user/api/get-layouts');
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}
