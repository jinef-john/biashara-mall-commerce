'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi } from './api';

export interface SiteConfig {
  categories: string[];
  subcategories: Record<string, string[]>;
  logoUrl: string | null;
  bannerUrl: string | null;
}

export function useSiteConfig() {
  return useQuery<SiteConfig>({
    queryKey: ['site-config'],
    queryFn: async () => {
      const { data } = await publicApi.get('/product/api/site-config');
      return data.config;
    },
    staleTime: Infinity,
  });
}
