'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackUserEvent } from '../actions/track-user';
import type { DeviceInfo } from '../shared/hooks/use-device-tracking';
import type { LocationInfo } from '../shared/hooks/use-location-tracking';

export interface LineItem {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  shopId?: string;
  shopName?: string;
}

/** Who/where/what-device an action happened on: carried through to Kafka. */
export interface TrackingContext {
  userId: string | null;
  location: LocationInfo | null;
  device: DeviceInfo | null;
}

type CartEventType =
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_wishlist'
  | 'remove_from_wishlist';

function trackEvent(type: CartEventType, item: LineItem, ctx: TrackingContext) {
  if (!ctx.userId || !ctx.location || !ctx.device) return;
  void trackUserEvent({
    clerkId: ctx.userId,
    action: type,
    productId: item.id,
    shopId: item.shopId,
    country: ctx.location.country,
    city: ctx.location.city,
    browser: ctx.device.browser,
    os: ctx.device.os,
    deviceType: ctx.device.deviceType,
  }).catch(() => {});
}

interface StoreState {
  cart: LineItem[];
  wishlist: LineItem[];
  addToCart: (item: LineItem, ctx: TrackingContext) => void;
  removeFromCart: (id: string, ctx: TrackingContext) => void;
  addToWishlist: (item: LineItem, ctx: TrackingContext) => void;
  removeFromWishlist: (id: string, ctx: TrackingContext) => void;
  setQuantity: (id: string, quantity: number, list?: 'cart' | 'wishlist') => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],

      addToCart: (item, ctx) => {
        set((s) => {
          const existing = s.cart.find((i) => i.id === item.id);
          return {
            cart: existing
              ? s.cart.map((i) =>
                  i.id === item.id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i,
                )
              : [...s.cart, item],
          };
        });
        trackEvent('add_to_cart', item, ctx);
      },

      removeFromCart: (id, ctx) => {
        set((s) => {
          const item = s.cart.find((i) => i.id === id);
          if (item) trackEvent('remove_from_cart', item, ctx);
          return { cart: s.cart.filter((i) => i.id !== id) };
        });
      },

      addToWishlist: (item, ctx) => {
        set((s) =>
          s.wishlist.some((i) => i.id === item.id)
            ? s
            : { wishlist: [...s.wishlist, item] },
        );
        trackEvent('add_to_wishlist', item, ctx);
      },

      removeFromWishlist: (id, ctx) => {
        set((s) => {
          const item = s.wishlist.find((i) => i.id === id);
          if (item) trackEvent('remove_from_wishlist', item, ctx);
          return { wishlist: s.wishlist.filter((i) => i.id !== id) };
        });
      },

      setQuantity: (id, quantity, list = 'cart') =>
        set((s) => ({
          [list]: s[list].map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    { name: 'biashara-store' },
  ),
);
