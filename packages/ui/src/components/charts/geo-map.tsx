'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import worldTopology from 'world-atlas/countries-110m.json';

export interface GeoMapPoint {
  country: string;
  orders: number;
  revenue: number;
}

// The storefront's country field is a closed list (@biashara-mall/config's
// COUNTRIES), but two of those names don't match world-atlas's topojson
// properties.name — everything else lines up exactly.
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'United States': 'United States of America',
  'South Sudan': 'S. Sudan',
};

export function GeoMap({ data }: { data: GeoMapPoint[] }) {
  const byMapName = new Map(
    data.map((d) => [COUNTRY_NAME_ALIASES[d.country] ?? d.country, d]),
  );
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));

  return (
    <ComposableMap projectionConfig={{ scale: 130 }} className="h-64 w-full">
      <Geographies geography={worldTopology}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const match = byMapName.get(geo.properties.name as string);
            const intensity = match ? match.orders / maxOrders : 0;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={
                  intensity > 0
                    ? `color-mix(in srgb, var(--color-primary) ${Math.round(20 + intensity * 80)}%, var(--color-surface-container))`
                    : 'var(--color-surface-container)'
                }
                stroke="var(--color-outline-variant)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', opacity: 0.8 },
                  pressed: { outline: 'none' },
                }}
              >
                <title>
                  {match
                    ? `${match.country}: ${match.orders} orders`
                    : (geo.properties.name as string)}
                </title>
              </Geography>
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
}
