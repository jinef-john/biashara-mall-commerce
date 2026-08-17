import Image from 'next/image';
import Link from 'next/link';
import { Package, Store, Users } from 'lucide-react';
import type { ShopCardData } from '../../types';

export function ShopCard({ shop }: { shop: ShopCardData }) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-shadow hover:shadow-lg"
    >
      <div className="relative h-24 bg-surface-container">
        {shop.coverUrl && (
          <Image
            src={shop.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 p-4 text-center">
        <div className="-mt-10 flex size-16 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container-low">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={64}
              height={64}
              className="size-full object-cover"
            />
          ) : (
            <Store className="size-6 text-on-surface-variant" />
          )}
        </div>

        <span className="line-clamp-1 text-body-lg font-medium text-on-surface">
          {shop.name}
        </span>
        {shop.category && (
          <span className="line-clamp-1 text-label-sm text-on-surface-variant">
            {shop.category}
          </span>
        )}

        <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Package className="size-3.5" />
            {shop._count.products}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {shop._count.followers}
          </span>
        </div>
      </div>
    </Link>
  );
}
