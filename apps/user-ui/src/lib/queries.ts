'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi, useApi } from './api';
import type { ProductCardData, ProductDetail, ShopCardData, ShopSummary } from '../shared/types';

export interface Pagination {
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductListResult {
  products: ProductCardData[];
  pagination: Pagination;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
  categories?: string[];
  colors?: string[];
  sizes?: string[];
  priceRange?: [number | null, number | null];
  shopId?: string;
}

function filterParams(filters: ProductFilters) {
  const params: Record<string, string> = {};
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.type) params.type = filters.type;
  if (filters.q) params.q = filters.q;
  if (filters.shopId) params.shopId = filters.shopId;
  if (filters.categories?.length) params.categories = filters.categories.join(',');
  if (filters.colors?.length) params.colors = filters.colors.join(',');
  if (filters.sizes?.length) params.sizes = filters.sizes.join(',');
  if (filters.priceRange && (filters.priceRange[0] != null || filters.priceRange[1] != null)) {
    params.priceRange = `${filters.priceRange[0] ?? ''},${filters.priceRange[1] ?? ''}`;
  }
  return params;
}

const hasFilters = (f: ProductFilters) =>
  Boolean(
    f.q ||
      f.shopId ||
      f.categories?.length ||
      f.colors?.length ||
      f.sizes?.length ||
      f.priceRange,
  );

export function useProducts(filters: ProductFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery<ProductListResult>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const { data } = await publicApi.get(
        hasFilters(filters) ? '/product/api/get-filtered-products' : '/product/api/get-all-products',
        { params: filterParams(filters) },
      );
      return data;
    },
    enabled: options.enabled,
  });
}

export function useEvents(filters: ProductFilters = {}, options: { enabled?: boolean } = {}) {
  return useQuery<ProductListResult>({
    queryKey: ['events', filters],
    queryFn: async () => {
      const { data } = await publicApi.get(
        hasFilters(filters) ? '/product/api/get-filtered-offers' : '/product/api/get-all-events',
        { params: filterParams(filters) },
      );
      return data;
    },
    enabled: options.enabled,
  });
}

export function useHomeProducts() {
  return useQuery<{ products: ProductCardData[]; top10: ProductCardData[]; pagination: Pagination }>({
    queryKey: ['home-products'],
    queryFn: async () => {
      const { data } = await publicApi.get('/product/api/get-all-products', {
        params: { limit: 10 },
      });
      return data;
    },
  });
}

// Personalised when signed in with enough history; the service falls back to
// the newest products otherwise, so the shelf is never empty.
export function useRecommendations(enabled: boolean) {
  const api = useApi();
  return useQuery<{ products: ProductCardData[]; source: string }>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const { data } = await api.get('/recommendation/api/get-recommendation-products');
      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeEvents() {
  return useQuery<{ products: ProductCardData[]; pagination: Pagination }>({
    queryKey: ['home-events'],
    queryFn: async () => {
      const { data } = await publicApi.get('/product/api/get-all-events', {
        params: { limit: 4 },
      });
      return data;
    },
  });
}

export function useTopShops(enabled = true) {
  return useQuery<{ shops: ShopCardData[] }>({
    queryKey: ['top-shops'],
    queryFn: async () => {
      const { data } = await publicApi.get('/product/api/top-shops');
      return data;
    },
    enabled,
  });
}

export interface ShopFilters {
  page?: number;
  limit?: number;
  categories?: string[];
  countries?: string[];
}

export function useShops(filters: ShopFilters = {}) {
  return useQuery<{ shops: ShopCardData[]; pagination: Pagination }>({
    queryKey: ['shops', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.page) params.page = String(filters.page);
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.categories?.length) params.categories = filters.categories.join(',');
      if (filters.countries?.length) params.countries = filters.countries.join(',');
      const { data } = await publicApi.get('/product/api/get-filtered-shops', { params });
      return data;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery<{ product: ProductDetail }>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await publicApi.get(`/product/api/get-product/${slug}`);
      return data;
    },
  });
}

interface ShopReview {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

export function useSeller(shopId: string) {
  return useQuery<{
    shop: ShopSummary & { reviews: ShopReview[] };
    isFollowing: boolean;
  }>({
    queryKey: ['seller', shopId],
    queryFn: async () => {
      const { data } = await publicApi.get(`/seller/api/get-seller/${shopId}`);
      return data;
    },
    enabled: Boolean(shopId),
  });
}
