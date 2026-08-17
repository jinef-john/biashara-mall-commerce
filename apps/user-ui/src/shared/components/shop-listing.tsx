'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { COUNTRIES } from '@biashara-mall/config';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Checkbox } from '@biashara-mall/ui/components/ui/checkbox';
import { Label } from '@biashara-mall/ui/components/ui/label';
import { useShops } from '../../lib/queries';
import { useSiteConfig } from '../../lib/use-site-config';
import { ShopCard } from './cards/shop-card';
import { ShopGridSkeleton } from './skeletons';
import { PageControls } from './page-controls';

function csv(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export function ShopListing() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: config } = useSiteConfig();

  const categories = csv(searchParams.get('categories'));
  const countries = csv(searchParams.get('countries'));
  const page = Number(searchParams.get('page')) || 1;

  const { data, isPending, isError, refetch } = useShops({
    page,
    limit: 20,
    categories,
    countries,
  });

  function toggle(key: 'categories' | 'countries', value: string) {
    const current = key === 'categories' ? categories : countries;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set(key, next.join(',')); else params.delete(key);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-headline-lg text-on-surface">Shops</h1>
        {data && (
          <p className="text-body-sm text-on-surface-variant">
            {data.pagination.total} {data.pagination.total === 1 ? 'shop' : 'shops'}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <aside className="flex w-full flex-col gap-6 sm:w-56">
          {(config?.categories?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-label-md text-on-surface">Category</h4>
              <div className="flex flex-col gap-2">
                {config!.categories.map((category) => (
                  <Label key={category} className="flex items-center gap-2 font-normal">
                    <Checkbox
                      checked={categories.includes(category)}
                      onCheckedChange={() => toggle('categories', category)}
                    />
                    <span className="text-body-sm text-on-surface-variant">
                      {category}
                    </span>
                  </Label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h4 className="text-label-md text-on-surface">Country</h4>
            <div className="flex flex-col gap-2">
              {COUNTRIES.map((country) => (
                <Label key={country} className="flex items-center gap-2 font-normal">
                  <Checkbox
                    checked={countries.includes(country)}
                    onCheckedChange={() => toggle('countries', country)}
                  />
                  <span className="text-body-sm text-on-surface-variant">
                    {country}
                  </span>
                </Label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-6">
          {isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
              <p className="text-body-md text-on-surface-variant">
                Could not load shops. The catalogue service may be offline.
              </p>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isPending ? (
            <ShopGridSkeleton />
          ) : data!.shops.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
              <p className="text-body-lg text-on-surface">No shops match yet.</p>
              <p className="text-body-sm text-on-surface-variant">
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data!.shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}

          {data && (
            <PageControls
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onChange={goToPage}
            />
          )}
        </div>
      </div>
    </main>
  );
}
