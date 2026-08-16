'use client';

import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';

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

export function ColorSelector({ control }: { control: Control<any> }) {
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
          <div className="flex flex-wrap items-center gap-sm">
            {[...DEFAULT_COLORS, ...customColors].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggle(color)}
                className={`h-8 w-8 rounded-full border-2 ${
                  selected.includes(color)
                    ? 'border-primary'
                    : 'border-outline-variant'
                }`}
                style={{ backgroundColor: color }}
                aria-label={color}
              />
            ))}
            <input
              type="color"
              onChange={(e) => {
                const color = e.target.value;
                if (!customColors.includes(color)) {
                  setCustomColors((prev) => [...prev, color]);
                }
              }}
              className="h-8 w-8 cursor-pointer rounded-full border border-outline-variant"
              title="Add a custom color"
            />
          </div>
        );
      }}
    />
  );
}
