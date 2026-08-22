'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useLayout } from '../lib/use-layout';
import { useHomeEvents, useHomeProducts, useTopShops } from '../lib/queries';
import { ProductSection } from '../shared/components/product-section';
import { ShopSection } from '../shared/components/shop-section';
import { HeroSkeleton } from '../shared/components/skeletons';
import { useIsSuspended } from '../lib/use-me';

export default function Home() {
  const { data: layout, isPending: layoutPending } = useLayout();
  const { data: homeProducts, isPending: productsPending } = useHomeProducts();
  const { data: homeEvents, isPending: eventsPending } = useHomeEvents();
  const suspended = useIsSuspended();
  // Not fetched at all when suspended: shops and offers are unreachable for
  // them, so the request is pure waste.
  const { data: topShops, isPending: shopsPending } = useTopShops(!suspended);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8">
      {layoutPending ? (
        <HeroSkeleton />
      ) : layout?.bannerUrl ? (
        <div className="relative h-64 overflow-hidden rounded-xl sm:h-80">
          <Image
            src={layout.bannerUrl}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-primary-container text-center sm:h-80">
          <h1 className="text-headline-xl text-on-primary-container">
            Shop everything, from everyone.
          </h1>
          <Button asChild>
            <Link href="/products">Start browsing</Link>
          </Button>
        </div>
      )}

      <ProductSection
        title="Suggested for you"
        viewAllHref="/products"
        products={homeProducts?.top10}
        isPending={productsPending}
      />

      <ProductSection
        title="Latest products"
        viewAllHref="/products?type=latest"
        products={homeProducts?.products}
        isPending={productsPending}
      />

      {!suspended && (
        <>
          <ShopSection
            title="Top shops"
            viewAllHref="/shops"
            shops={topShops?.shops}
            isPending={shopsPending}
          />

          <ProductSection
            title="Top offers"
            viewAllHref="/offers"
            products={homeEvents?.products}
            isPending={eventsPending}
          />
        </>
      )}
    </main>
  );
}
