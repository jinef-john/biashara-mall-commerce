'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@biashara-mall/ui/lib/utils';

export function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={value === star}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(star)}
            className="rounded-sm p-0.5 transition-transform hover:scale-110 disabled:pointer-events-none disabled:opacity-50"
          >
            <Star
              className={cn(
                'size-6',
                shown >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-outline-variant',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
