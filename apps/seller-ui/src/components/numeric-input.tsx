'use client';

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { clampDecimal, clampInteger } from '../lib/format';

/**
 * Strips invalid characters as they are typed. React Hook Form's `pattern`
 * only runs on submit, so on its own it lets a seller fill a price field with
 * letters and hear nothing until the end.
 */
export function NumericInput<T extends FieldValues>({
  control,
  name,
  variant,
  rules,
  ...props
}: {
  control: Control<T>;
  name: Path<T>;
  variant: 'decimal' | 'integer';
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'name'>) {
  const clamp = variant === 'integer' ? clampInteger : clampDecimal;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <Input
          {...props}
          inputMode={variant === 'integer' ? 'numeric' : 'decimal'}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={(e) => field.onChange(clamp(e.target.value))}
        />
      )}
    />
  );
}
