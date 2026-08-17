'use client';

import { Controller, type Control } from 'react-hook-form';
import type { CreateProductForm } from './types';
import { Toggle } from '@biashara-mall/ui/components/ui/toggle';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function SizeSelector({ control }: { control: Control<CreateProductForm> }) {
  return (
    <Controller
      name="sizes"
      control={control}
      defaultValue={[]}
      render={({ field }) => {
        const selected: string[] = field.value ?? [];
        const toggle = (size: string) => {
          field.onChange(
            selected.includes(size)
              ? selected.filter((s) => s !== size)
              : [...selected, size],
          );
        };

        return (
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SIZES.map((size) => (
              <Toggle
                key={size}
                variant="outline"
                pressed={selected.includes(size)}
                onPressedChange={() => toggle(size)}
              >
                {size}
              </Toggle>
            ))}
          </div>
        );
      }}
    />
  );
}
