import { Suspense } from 'react';
import { ShopListing } from '../../shared/components/shop-listing';
import { ShopGridSkeleton } from '../../shared/components/skeletons';

export const metadata = {
  title: 'Shops — Biashara Mall',
};

export default function ShopsPage() {
  return (
    <Suspense fallback={<ShopGridSkeleton />}>
      <ShopListing />
    </Suspense>
  );
}
