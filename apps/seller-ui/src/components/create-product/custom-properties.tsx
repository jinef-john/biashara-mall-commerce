'use client';

import { useEffect, useState } from 'react';
import { useController, type Control } from 'react-hook-form';

interface Property {
  label: string;
  values: string[];
}

export function CustomProperties({ control }: { control: Control<any> }) {
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
          className="rounded border border-outline-variant p-2"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-label-md text-on-surface">
              {property.label}
            </span>
            <button
              type="button"
              onClick={() => removeProperty(property.label)}
              className="text-body-sm text-error"
            >
              Remove
            </button>
          </div>
          <div className="mb-1 flex flex-wrap gap-1">
            {property.values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-surface-container px-2 py-1 text-body-sm text-on-surface"
              >
                {v}
              </span>
            ))}
          </div>
          {activeLabel === property.label && (
            <div className="flex gap-1">
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add option value"
                className="flex-1 rounded border border-outline-variant px-2 py-1 text-body-sm text-on-surface"
              />
              <button
                type="button"
                onClick={() => addValue(property.label)}
                className="text-label-md text-primary"
              >
                Add
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-1">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Property label (e.g. Material)"
          className="flex-1 rounded border border-outline-variant px-4 py-2 text-body-sm text-on-surface"
        />
        <button
          type="button"
          onClick={addProperty}
          className="w-fit text-label-md text-primary"
        >
          + Add property
        </button>
      </div>
    </div>
  );
}
