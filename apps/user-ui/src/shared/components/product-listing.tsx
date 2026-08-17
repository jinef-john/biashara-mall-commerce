'use client';

import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@biashara-mall/ui/components/ui/sheet';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useEvents, useProducts } from '../../lib/queries';
import { useProductFilters } from '../../lib/use-product-filters';
import { ProductCard } from './cards/product-card';
import { ProductFilters } from './product-filters';
import { ProductGridSkeleton } from './skeletons';
import { PageControls } from './page-controls';

export function ProductListing({ kind }: { kind: 'products' | 'offers' }) {
  const searchParams = useSearchParams();
  const { categories, colors, sizes, priceRange, page, update } = useProductFilters();
  const q = searchParams.get('q') ?? undefined;
  const type = searchParams.get('type') ?? undefined;

  const filters = { page, limit: 20, q, type, categories, colors, sizes, priceRange };
  // Both hooks are always called — hook order must stay stable — but only the
  // one matching `kind` is enabled, so only one ever actually fetches.
  const productsQuery = useProducts(filters, { enabled: kind === 'products' });
  const eventsQuery = useEvents(filters, { enabled: kind === 'offers' });
  const { data, isPending, isError, refetch } =
    kind === 'offers' ? eventsQuery : productsQuery;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-on-surface">
            {kind === 'offers' ? 'Offers' : q ? `Results for “${q}”` : 'All products'}
          </h1>
          {data && (
            <p className="text-body-sm text-on-surface-variant">
              {data.pagination.total} {data.pagination.total === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="sm:hidden">
              <SlidersHorizontal />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto p-4">
            <SheetTitle className="sr-only">Filters</SheetTitle>
            <ProductFilters />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="hidden sm:block">
          <ProductFilters />
        </div>

        <div className="flex flex-1 flex-col gap-6">
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
              <p className="text-body-md text-on-surface-variant">
                Could not load {kind}. The catalogue service may be offline.
              </p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isPending ? (
            <ProductGridSkeleton />
          ) : data!.products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
              <p className="text-body-lg text-on-surface">Nothing matches yet.</p>
              <p className="text-body-sm text-on-surface-variant">
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data!.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {data && (
            <PageControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onChange={(p) => update({ page: String(p) })}
            />
          )}
        </div>
      </div>
    </main>
  );
}
