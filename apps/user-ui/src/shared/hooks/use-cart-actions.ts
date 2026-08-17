'use client';

import { useUser } from '@clerk/nextjs';
import { useStore, type LineItem } from '../../store';
import { useDeviceTracking } from './use-device-tracking';
import { useLocationTracking } from './use-location-tracking';

/**
 * Wraps the store's tracked cart/wishlist actions so call sites don't have
 * to thread the Clerk user, IP location, and device info through every call.
 */
export function useCartActions() {
  const { user } = useUser();
  const location = useLocationTracking();
  const device = useDeviceTracking();
  const ctx = { userId: user?.id ?? null, location, device };

  const storeAddToCart = useStore((s) => s.addToCart);
  const storeRemoveFromCart = useStore((s) => s.removeFromCart);
  const storeAddToWishlist = useStore((s) => s.addToWishlist);
  const storeRemoveFromWishlist = useStore((s) => s.removeFromWishlist);

  return {
    addToCart: (item: LineItem) => storeAddToCart(item, ctx),
    removeFromCart: (id: string) => storeRemoveFromCart(id, ctx),
    addToWishlist: (item: LineItem) => storeAddToWishlist(item, ctx),
    removeFromWishlist: (id: string) => storeRemoveFromWishlist(id, ctx),
  };
}
