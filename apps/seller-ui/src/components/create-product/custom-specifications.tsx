'use client';

import { useFieldArray, Controller, type Control } from 'react-hook-form';
import type { CreateProductForm } from './types';
import { Plus, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';

export function CustomSpecifications({ control }: { control: Control<CreateProductForm> }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customSpecifications',
  });

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Controller
            name={`customSpecifications.${index}.name`}
            control={control}
            rules={{ required: true }}
            render={({ field: nameField }) => (
              <Input
                {...nameField}
                placeholder="Specification name (e.g. Material)"
                className="flex-1"
              />
            )}
          />
          <Controller
            name={`customSpecifications.${index}.value`}
            control={control}
            rules={{ required: true }}
            render={({ field: valueField }) => (
              <Input
                {...valueField}
                placeholder="Value (e.g. Aluminum)"
                className="flex-1"
              />
            )}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={() => remove(index)}
            aria-label="Remove specification"
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ name: '', value: '' })}
      >
        <Plus />
        Add specification
      </Button>
    </div>
  );
}
