'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import worldTopology from 'world-atlas/countries-110m.json';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@biashara-mall/ui/components/ui/tooltip';

export interface GeoMapPoint {
  country: string;
  orders: number;
  revenue: number;
}

// The storefront's country field is a closed list (@biashara-mall/config's
// COUNTRIES), but two of those names don't match world-atlas's topojson
// properties.name; everything else lines up exactly.
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'United States': 'United States of America',
  'South Sudan': 'S. Sudan',
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DEFAULT_POSITION = { coordinates: [0, 0] as [number, number], zoom: MIN_ZOOM };

export function GeoMap({ data }: { data: GeoMapPoint[] }) {
  const [position, setPosition] = useState(DEFAULT_POSITION);

  const byMapName = new Map(
    data.map((d) => [COUNTRY_NAME_ALIASES[d.country] ?? d.country, d]),
  );
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));

  const zoomIn = () =>
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, MAX_ZOOM) }));
  const zoomOut = () =>
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, MIN_ZOOM) }));
  const reset = () => setPosition(DEFAULT_POSITION);

  return (
    <TooltipProvider>
      <div className="relative">
        <ComposableMap projectionConfig={{ scale: 130 }} className="h-64 w-full">
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={setPosition}
          >
            <Geographies geography={worldTopology}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const match = byMapName.get(geo.properties.name as string);
                  const intensity = match ? match.orders / maxOrders : 0;
                  return (
                    <Tooltip key={geo.rsmKey}>
                      <TooltipTrigger asChild>
                        <Geography
                          geography={geo}
                          fill={
                            intensity > 0
                              ? `color-mix(in srgb, var(--color-primary) ${Math.round(20 + intensity * 80)}%, var(--color-surface-container))`
                              : 'var(--color-surface-container)'
                          }
                          stroke="var(--color-outline-variant)"
                          strokeWidth={0.5 / position.zoom}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', opacity: 0.8 },
                            pressed: { outline: 'none' },
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {match
                          ? `${match.country}: ${match.orders} order${match.orders === 1 ? '' : 's'}, $${match.revenue.toLocaleString()}`
                          : (geo.properties.name as string)}
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Button type="button" variant="secondary" size="icon-sm" onClick={zoomIn} aria-label="Zoom in">
            <ZoomIn />
          </Button>
          <Button type="button" variant="secondary" size="icon-sm" onClick={zoomOut} aria-label="Zoom out">
            <ZoomOut />
          </Button>
          <Button type="button" variant="secondary" size="icon-sm" onClick={reset} aria-label="Reset view">
            <RotateCcw />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
