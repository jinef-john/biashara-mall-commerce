'use client';

import { useState } from 'react';
import {
  Controller,
  useFieldArray,
  type Control,
} from 'react-hook-form';
import type { CreateProductForm } from './types';
import { Plus, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Badge } from '@biashara-mall/ui/components/ui/badge';

function PropertyRow({
  control,
  index,
  onRemove,
}: {
  control: Control<CreateProductForm>;
  index: number;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="rounded-lg border border-outline-variant p-2">
      <div className="mb-1 flex items-center gap-2">
        <Controller
          name={`customProperties.${index}.label`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Property label (e.g. Material)"
              className="flex-1"
            />
          )}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove property"
        >
          <X />
        </Button>
      </div>

      <Controller
        name={`customProperties.${index}.values`}
        control={control}
        render={({ field }) => {
          const values: string[] = field.value ?? [];

          const addValue = () => {
            const v = draft.trim();
            if (!v || values.includes(v)) return;
            field.onChange([...values, v]);
            setDraft('');
          };

          return (
            <>
              {values.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {values.map((v) => (
                    <Badge key={v} variant="secondary" className="gap-1">
                      {v}
                      <button
                        type="button"
                        aria-label={`Remove ${v}`}
                        onClick={() =>
                          field.onChange(values.filter((x) => x !== v))
                        }
                        className="hover:text-error"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                  placeholder="Add option value"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addValue}
                >
                  Add
                </Button>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}

export function CustomProperties({
  control,
}: {
  control: Control<CreateProductForm>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customProperties',
  });

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, index) => (
        <PropertyRow
          key={field.id}
          control={control}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ label: '', values: [] })}
      >
        <Plus />
        Add property
      </Button>
    </div>
  );
}
