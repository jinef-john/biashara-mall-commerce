import { Star } from 'lucide-react';
import { cn } from '@biashara-mall/ui/lib/utils';

export function Ratings({
  value,
  count,
  size = 'sm',
}: {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
}) {
  const starSize = size === 'md' ? 'size-4' : 'size-3.5';

  return (
    <div className="flex items-center gap-1">
      <div className="flex" aria-label={`${value.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = value >= i + 1;
          const half = !filled && value > i && value < i + 1;
          return (
            <Star
              key={i}
              className={cn(
                starSize,
                filled || half
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-outline-variant',
              )}
            />
          );
        })}
      </div>
      {count != null && (
        <span className="text-label-sm text-on-surface-variant">({count})</span>
      )}
    </div>
  );
}
