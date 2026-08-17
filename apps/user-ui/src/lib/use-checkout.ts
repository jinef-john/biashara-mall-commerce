'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './api';
import type { LineItem } from '../store';

export interface SessionCartItem {
  productId: string;
  title: string;
  quantity: number;
  salePrice: number;
  shopId: string;
  selectedOptions: { color?: string; size?: string } | null;
}

export interface CheckoutSession {
  sessionId: string;
  cart: SessionCartItem[];
  shippingAddress: {
    label: string;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  subtotal: number;
  total: number;
  couponCode: string | null;
  discount: {
    discountAmount: number;
    discountedProductId: string;
    discountType: 'percentage' | 'flat';
  } | null;
}

export function cartToPayload(cart: LineItem[]) {
  return cart.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    color: item.color,
    size: item.size,
  }));
}

export function useCheckoutSession(sessionId: string | null) {
  const api = useApi();

  return useQuery<{
    session: CheckoutSession;
    provider: 'stripe' | 'mock';
    currency: string;
  }>({
    queryKey: ['checkout-session', sessionId],
    queryFn: async () => {
      const { data } = await api.get('/order/api/verifying-payment-session', {
        params: { sessionId },
      });
      return data;
    },
    enabled: Boolean(sessionId),
    retry: false,
  });
}
