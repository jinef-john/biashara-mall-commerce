'use client';

import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import type { CreateProductForm } from './types';
import { Check } from 'lucide-react';
import { Toggle } from '@biashara-mall/ui/components/ui/toggle';

const DEFAULT_COLORS = [
  '#000000',
  '#ffffff',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
  '#eab308',
  '#ec4899',
  '#06b6d4',
];

/** White-ish swatches need a dark checkmark to stay visible. */
function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export function ColorSelector({ control }: { control: Control<CreateProductForm> }) {
  const [customColors, setCustomColors] = useState<string[]>([]);

  return (
    <Controller
      name="colors"
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const selected: string[] = field.value ?? [];
        const toggle = (color: string) => {
          field.onChange(
            selected.includes(color)
              ? selected.filter((c) => c !== color)
              : [...selected, color],
          );
        };

        return (
          <div className="flex flex-wrap items-center gap-2">
            {[...DEFAULT_COLORS, ...customColors].map((color) => (
              <Toggle
                key={color}
                variant="outline"
                size="sm"
                pressed={selected.includes(color)}
                onPressedChange={() => toggle(color)}
                aria-label={color}
                title={color}
                // The swatch *is* the control, so the background carries the
                // color and only the ring/check signals selection.
                className="size-8 rounded-full border-outline-variant p-0 hover:opacity-80 data-[state=on]:bg-transparent data-[state=on]:ring-2 data-[state=on]:ring-primary"
                style={{ backgroundColor: color }}
              >
                {selected.includes(color) && (
                  <Check
                    className={isLight(color) ? 'text-black' : 'text-white'}
                  />
                )}
              </Toggle>
            ))}

            <label
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-outline text-on-surface-variant hover:bg-surface-container"
              title="Add a custom color"
            >
              <span className="text-body-sm">+</span>
              <input
                type="color"
                className="sr-only"
                onChange={(e) => {
                  const color = e.target.value;
                  if (
                    !DEFAULT_COLORS.includes(color) &&
                    !customColors.includes(color)
                  ) {
                    setCustomColors((prev) => [...prev, color]);
                  }
                }}
              />
            </label>
          </div>
        );
      }}
    />
  );
}
