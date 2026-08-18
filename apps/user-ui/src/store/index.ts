'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

/** Who/where/what-device an action happened on: carried through to the
 * Kafka event Phase 7 adds. The emit is a no-op today; this signature is
 * what lets that phase land without touching every call site again. */
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

function trackEvent(
  _type: CartEventType,
  _item: LineItem,
  _ctx: TrackingContext,
) {
  // No-op until Phase 7 wires this to Kafka.
}

interface StoreState {
  cart: LineItem[];
  wishlist: LineItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
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
      isCartOpen: false,

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

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
            isCartOpen: true,
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
    {
      name: 'biashara-store',
      // isCartOpen is ephemeral UI state, not something to restore on reload.
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist }),
    },
  ),
);
