import { Suspense } from 'react';
import { ProductListing } from '../../shared/components/product-listing';
import { ProductGridSkeleton } from '../../shared/components/skeletons';

export const metadata = {
  title: 'Offers | Biashara Mall',
};

export default function OffersPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductListing kind="offers" />
    </Suspense>
  );
}
