'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LineItem {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

interface StoreState {
  cart: LineItem[];
  wishlist: LineItem[];
  addToCart: (item: LineItem) => void;
  removeFromCart: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (item: LineItem) => void;
  clearCart: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],

      addToCart: (item) =>
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
        }),

      removeFromCart: (id) =>
        set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),

      setQuantity: (id, quantity) =>
        set((s) => ({
          cart: s.cart.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        })),

      toggleWishlist: (item) =>
        set((s) => ({
          wishlist: s.wishlist.some((i) => i.id === item.id)
            ? s.wishlist.filter((i) => i.id !== item.id)
            : [...s.wishlist, item],
        })),

      clearCart: () => set({ cart: [] }),
    }),
    { name: 'biashara-store' },
  ),
);
