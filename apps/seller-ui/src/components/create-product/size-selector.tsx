'use client';

import { Controller, type Control } from 'react-hook-form';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function SizeSelector({ control }: { control: Control<any> }) {
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
          <div className="flex flex-wrap gap-sm">
            {DEFAULT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggle(size)}
                className={`rounded border px-md py-xs text-body-sm ${
                  selected.includes(size)
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant text-on-surface'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        );
      }}
    />
  );
}
