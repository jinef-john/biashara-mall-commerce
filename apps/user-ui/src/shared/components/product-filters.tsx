'use client';

import { useState } from 'react';
import { DEFAULT_COLORS, DEFAULT_SIZES } from '@biashara-mall/config';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Checkbox } from '@biashara-mall/ui/components/ui/checkbox';
import { Label } from '@biashara-mall/ui/components/ui/label';
import { Slider } from '@biashara-mall/ui/components/ui/slider';
import { Toggle } from '@biashara-mall/ui/components/ui/toggle';
import { cn } from '@biashara-mall/ui/lib/utils';
import { formatPrice } from '../../lib/format';
import { useSiteConfig } from '../../lib/use-site-config';
import { useProductFilters } from '../../lib/use-product-filters';

const PRICE_CEILING = 2000;

function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export function ProductFilters() {
  const { data: config } = useSiteConfig();
  const { categories, colors, sizes, priceRange, toggle, update, clear, hasFilters } =
    useProductFilters();

  const [draftPrice, setDraftPrice] = useState<[number, number]>([
    priceRange[0] ?? 0,
    priceRange[1] ?? PRICE_CEILING,
  ]);

  return (
    <aside className="flex w-full flex-col gap-6 sm:w-56">
      <div className="flex items-center justify-between">
        <h3 className="text-label-md text-on-surface">Filters</h3>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear all
          </Button>
        )}
      </div>

      {(config?.categories?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-label-md text-on-surface">Category</h4>
          <div className="flex flex-col gap-2">
            {config!.categories.map((category) => (
              <Label key={category} className="flex items-center gap-2 font-normal">
                <Checkbox
                  checked={categories.includes(category)}
                  onCheckedChange={() => toggle('categories', category)}
                />
                <span className="text-body-sm text-on-surface-variant">
                  {category}
                </span>
              </Label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h4 className="text-label-md text-on-surface">Price</h4>
        <Slider
          min={0}
          max={PRICE_CEILING}
          step={10}
          minStepsBetweenThumbs={5}
          value={draftPrice}
          onValueChange={(v) => setDraftPrice(v as [number, number])}
          onValueCommit={(v) =>
            update({ priceMin: String(v[0]), priceMax: String(v[1]) })
          }
        />
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <span>{formatPrice(draftPrice[0])}</span>
          <span>{formatPrice(draftPrice[1])}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-label-md text-on-surface">Color</h4>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_COLORS.map((color) => (
            <Toggle
              key={color}
              variant="outline"
              size="sm"
              pressed={colors.includes(color)}
              onPressedChange={() => toggle('colors', color)}
              aria-label={color}
              title={color}
              className="size-7 rounded-full border-outline-variant p-0 data-[state=on]:ring-2 data-[state=on]:ring-primary"
              style={{ backgroundColor: color }}
            >
              {colors.includes(color) && (
                <span
                  className={cn(
                    'text-[10px]',
                    isLight(color) ? 'text-black' : 'text-white',
                  )}
                >
                  ✓
                </span>
              )}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="text-label-md text-on-surface">Size</h4>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SIZES.map((size) => (
            <Toggle
              key={size}
              variant="outline"
              size="sm"
              pressed={sizes.includes(size)}
              onPressedChange={() => toggle('sizes', size)}
            >
              {size}
            </Toggle>
          ))}
        </div>
      </div>
    </aside>
  );
}
