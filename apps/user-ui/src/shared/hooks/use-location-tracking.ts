'use client';

import { useEffect, useState } from 'react';

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
}

const STORAGE_KEY = 'user_location';
const TTL_MS = 20 * 24 * 60 * 60 * 1000;

/**
 * IP geolocation, cached in localStorage for 20 days. ip-api.com's free tier
 * is HTTP-only — fine served from localhost, but would need a server-side
 * proxy if this app is ever deployed behind HTTPS (mixed content).
 */
export function useLocationTracking(): LocationInfo | null {
  const [location, setLocation] = useState<LocationInfo | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const { value, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          setLocation(value);
          return;
        }
      } catch {
        // fall through and refetch
      }
    }

    fetch('http://ip-api.com/json')
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== 'success') return;
        const value: LocationInfo = {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          lat: data.lat,
          lon: data.lon,
        };
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ value, expiresAt: Date.now() + TTL_MS }),
        );
        setLocation(value);
      })
      .catch(() => {
        // Best-effort tracking — a failed lookup shouldn't break the cart.
      });
  }, []);

  return location;
}
