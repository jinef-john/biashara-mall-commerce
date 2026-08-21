'use client';

import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';
import type { UserEventAction } from '@biashara-mall/kafka';
import { trackUserEvent } from '../../actions/track-user';
import { useDeviceTracking } from './use-device-tracking';
import { useLocationTracking } from './use-location-tracking';

/** For page-mount events (product_view, shop_visit) that aren't a store action. */
export function useTrackEvent() {
  const { user } = useUser();
  const location = useLocationTracking();
  const device = useDeviceTracking();
  const userId = user?.id ?? null;

  return useCallback(
    (action: UserEventAction, target: { productId?: string; shopId?: string }) => {
      if (!userId || !location || !device) return;
      void trackUserEvent({
        clerkId: userId,
        action,
        ...target,
        country: location.country,
        city: location.city,
        browser: device.browser,
        os: device.os,
        deviceType: device.deviceType,
      }).catch(() => undefined);
    },
    [userId, location, device],
  );
}
