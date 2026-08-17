'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, Heart, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { cn } from '@biashara-mall/ui/lib/utils';
import { useStore } from '../../../store';
import { useCountdown } from '../../hooks/use-countdown';
import { formatPrice } from '../../../lib/format';
import { Ratings } from '../ratings';
import { ProductDetailsCard } from '../product-details-card';
import type { ProductCardData } from '../../types';

export function ProductCard({ product }: { product: ProductCardData }) {
  const [quickView, setQuickView] = useState(false);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const inWishlist = useStore((s) => s.wishlist.some((i) => i.id === product.id));

  const isEvent = Boolean(product.startingDate);
  const countdown = useCountdown(
    isEvent && product.endingDate ? new Date(product.endingDate) : null,
  );
  const outOfStock = product.stock <= 0;
  const limitedStock = !outOfStock && product.stock <= 5;
  const onSale = product.salePrice < product.regularPrice;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.images[0]?.fileUrl,
      price: product.salePrice,
      quantity: 1,
    });
    toast.success(`${product.title} added to cart`);
  };

  return (
    <>
      <Link
        href={`/product/${product.slug}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-shadow hover:shadow-lg"
      >
        <div className="relative aspect-square overflow-hidden bg-surface-container">
          {product.images[0] ? (
            <Image
              src={product.images[0].fileUrl}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-surface-container" />
          )}

          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {isEvent && countdown && (
              <Badge className="border-transparent bg-tertiary text-on-tertiary">
                {countdown === 'Expired' ? 'Ended' : `Ends in ${countdown}`}
              </Badge>
            )}
            {limitedStock && <Badge variant="destructive">Limited Stock</Badge>}
            {outOfStock && <Badge variant="outline">Out of stock</Badge>}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-full border-transparent bg-surface-container-lowest shadow hover:bg-surface-container-lowest"
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist({
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  imageUrl: product.images[0]?.fileUrl,
                  price: product.salePrice,
                  quantity: 1,
                });
              }}
            >
              <Heart className={cn(inWishlist && 'fill-red-500 text-red-500')} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8 rounded-full border-transparent bg-surface-container-lowest shadow hover:bg-surface-container-lowest"
              aria-label="Quick view"
              onClick={(e) => {
                e.preventDefault();
                setQuickView(true);
              }}
            >
              <Eye />
            </Button>
            <Button
              type="button"
              size="icon"
              className="size-8 rounded-full shadow"
              aria-label="Add to cart"
              disabled={outOfStock}
              onClick={quickAdd}
            >
              <Plus />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-1 text-label-sm text-on-surface-variant">
            {product.shop.name}
          </span>
          <span className="line-clamp-2 text-body-md text-on-surface">
            {product.title}
          </span>
          <Ratings value={product.ratings} size="sm" />
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-body-lg font-medium text-on-surface">
              {formatPrice(product.salePrice)}
            </span>
            {onSale && (
              <span className="text-label-sm text-on-surface-variant line-through">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <ProductDetailsCard
        slug={product.slug}
        open={quickView}
        onOpenChange={setQuickView}
      />
    </>
  );
}
