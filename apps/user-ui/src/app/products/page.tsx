import { Suspense } from 'react';
import { ProductListing } from '../../shared/components/product-listing';
import { ProductGridSkeleton } from '../../shared/components/skeletons';

export const metadata = {
  title: 'All products — Biashara Mall',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductListing kind="products" />
    </Suspense>
  );
}
