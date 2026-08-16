'use client';

import { useFieldArray, Controller, type Control } from 'react-hook-form';

export function CustomSpecifications({ control }: { control: Control<any> }) {
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
              <input
                {...nameField}
                placeholder="Specification name (e.g. Material)"
                className="flex-1 rounded border border-outline-variant px-4 py-2 text-body-sm text-on-surface"
              />
            )}
          />
          <Controller
            name={`customSpecifications.${index}.value`}
            control={control}
            rules={{ required: true }}
            render={({ field: valueField }) => (
              <input
                {...valueField}
                placeholder="Value (e.g. Aluminum)"
                className="flex-1 rounded border border-outline-variant px-4 py-2 text-body-sm text-on-surface"
              />
            )}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-body-sm text-error"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ name: '', value: '' })}
        className="w-fit text-label-md text-primary"
      >
        + Add specification
      </button>
    </div>
  );
}
