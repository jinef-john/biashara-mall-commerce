'use client';

import { useProducts } from '../../lib/queries';
import { ProductCard } from './cards/product-card';
import { ProductGridSkeleton } from './skeletons';

export function RelatedProducts({
  category,
  excludeId,
}: {
  category: string;
  excludeId: string;
}) {
  const { data, isPending } = useProducts({ categories: [category], limit: 6 });
  const products = data?.products.filter((p) => p.id !== excludeId) ?? [];

  if (!isPending && products.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-headline-md text-on-surface">You may also like</h2>
      {isPending ? (
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
