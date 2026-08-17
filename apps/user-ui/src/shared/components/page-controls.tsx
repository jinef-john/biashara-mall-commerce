'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';

export function PageControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="px-1 text-on-surface-variant">…</span>
          )}
          <Button
            type="button"
            variant={p === page ? 'outline' : 'ghost'}
            size="icon"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        </span>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
