import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from './cards/product-card';
import { ProductGridSkeleton } from './skeletons';
import type { ProductCardData } from '../types';

export function ProductSection({
  title,
  viewAllHref,
  products,
  isPending,
}: {
  title: string;
  viewAllHref: string;
  products?: ProductCardData[];
  isPending: boolean;
}) {
  if (!isPending && !products?.length) return null;

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
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products!.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
