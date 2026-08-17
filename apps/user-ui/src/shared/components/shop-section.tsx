import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ShopCard } from './cards/shop-card';
import { ShopGridSkeleton } from './skeletons';
import type { ShopCardData } from '../types';

export function ShopSection({
  title,
  viewAllHref,
  shops,
  isPending,
}: {
  title: string;
  viewAllHref: string;
  shops?: ShopCardData[];
  isPending: boolean;
}) {
  if (!isPending && !shops?.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-md text-on-surface">{title}</h2>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-label-md text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {isPending ? (
        <ShopGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shops!.slice(0, 8).map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </section>
  );
}
