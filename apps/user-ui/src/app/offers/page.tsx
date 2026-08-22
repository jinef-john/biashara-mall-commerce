import { Suspense } from 'react';
import { ProductListing } from '../../shared/components/product-listing';
import { ProductGridSkeleton } from '../../shared/components/skeletons';
import { SuspendedGate } from '../../shared/components/suspended-gate';

export const metadata = {
  title: 'Offers | Biashara Mall',
};

export default function OffersPage() {
  return (
    <SuspendedGate>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductListing kind="offers" />
      </Suspense>
    </SuspendedGate>
  );
}
