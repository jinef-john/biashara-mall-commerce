import { Suspense } from 'react';
import { ShopListing } from '../../shared/components/shop-listing';
import { ShopGridSkeleton } from '../../shared/components/skeletons';
import { SuspendedGate } from '../../shared/components/suspended-gate';

export const metadata = {
  title: 'Shops | Biashara Mall',
};

export default function ShopsPage() {
  return (
    <SuspendedGate>
      <Suspense fallback={<ShopGridSkeleton />}>
        <ShopListing />
      </Suspense>
    </SuspendedGate>
  );
}
