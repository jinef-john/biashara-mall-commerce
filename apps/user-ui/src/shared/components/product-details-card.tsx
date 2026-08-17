'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@biashara-mall/ui/components/ui/dialog';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { useProduct } from '../../lib/queries';
import { formatPrice } from '../../lib/format';
import { Ratings } from './ratings';
import { AddToCartControls } from './add-to-cart-controls';

/** Quick-view modal opened from a product card's Eye action. */
export function ProductDetailsCard({
  slug,
  open,
  onOpenChange,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isPending } = useProduct(slug);
  const [activeImage, setActiveImage] = useState(0);
  const product = data?.product;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setActiveImage(0);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {isPending || !product ? (
          <div className="grid gap-6 sm:grid-cols-2">
            <DialogTitle className="sr-only">Loading product</DialogTitle>
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
                {product.images[activeImage] && (
                  <Image
                    src={product.images[activeImage].fileUrl}
                    alt={product.title}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((image, i) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={
                        i === activeImage
                          ? 'relative size-14 overflow-hidden rounded-md ring-2 ring-primary'
                          : 'relative size-14 overflow-hidden rounded-md opacity-70 hover:opacity-100'
                      }
                    >
                      <Image
                        src={image.fileUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <DialogTitle className="text-headline-sm text-on-surface">
                {product.title}
              </DialogTitle>
              <Link
                href={`/shop/${product.shop.id}`}
                className="text-label-md text-primary hover:underline"
              >
                {product.shop.name}
              </Link>
              <Ratings value={product.ratings} size="md" />

              <div className="flex items-baseline gap-2">
                <span className="text-headline-sm text-on-surface">
                  {formatPrice(product.salePrice)}
                </span>
                {product.salePrice < product.regularPrice && (
                  <span className="text-body-sm text-on-surface-variant line-through">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
              </div>

              <p className="line-clamp-3 text-body-sm text-on-surface-variant">
                {product.shortDescription}
              </p>

              <AddToCartControls
                product={product}
                colors={product.colors}
                sizes={product.sizes}
              />

              <Link
                href={`/product/${product.slug}`}
                className="text-label-md text-primary hover:underline"
              >
                View full details
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
