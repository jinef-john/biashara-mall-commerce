'use client';

import { useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  browser?: string;
  os?: string;
  deviceType: string;
}

/** Parsed once per session from navigator.userAgent. */
export function useDeviceTracking(): DeviceInfo | null {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const { browser, os, device: dev } = new UAParser().getResult();
    setDevice({
      browser: browser.name,
      os: os.name,
      deviceType: dev.type ?? 'desktop',
    });
  }, []);

  return device;
}
