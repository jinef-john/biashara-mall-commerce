'use client';

import { useEffect, useState } from 'react';
import { useController, type Control } from 'react-hook-form';
import type { CreateProductForm } from './types';
import { Plus, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Badge } from '@biashara-mall/ui/components/ui/badge';

interface Property {
  label: string;
  values: string[];
}

export function CustomProperties({ control }: { control: Control<CreateProductForm> }) {
  const { field } = useController({
    name: 'customProperties',
    control,
    defaultValue: [],
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    field.onChange(properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties]);

  const addProperty = () => {
    if (!newLabel.trim()) return;
    setProperties((prev) => [...prev, { label: newLabel, values: [] }]);
    setActiveLabel(newLabel);
    setNewLabel('');
  };

  const addValue = (label: string) => {
    if (!newValue.trim()) return;
    setProperties((prev) =>
      prev.map((p) =>
        p.label === label ? { ...p, values: [...p.values, newValue] } : p,
      ),
    );
    setNewValue('');
  };

  const removeProperty = (label: string) => {
    setProperties((prev) => prev.filter((p) => p.label !== label));
  };

  return (
    <div className="flex flex-col gap-2">
      {properties.map((property) => (
        <div
          key={property.label}
          className="rounded-lg border border-outline-variant p-2"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-md text-on-surface">
              {property.label}
            </span>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              onClick={() => removeProperty(property.label)}
              aria-label={`Remove ${property.label}`}
            >
              <X />
            </Button>
          </div>
          <div className="mb-1 flex flex-wrap gap-1">
            {property.values.map((v) => (
              <Badge key={v} variant="secondary">
                {v}
              </Badge>
            ))}
          </div>
          {activeLabel === property.label && (
            <div className="flex gap-1">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add option value"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addValue(property.label)}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-1">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Property label (e.g. Material)"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={addProperty}
        >
          <Plus />
          Add property
        </Button>
      </div>
    </div>
  );
}
