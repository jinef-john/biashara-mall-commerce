'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { RotateCcw, ShieldCheck, Store, Truck } from 'lucide-react';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { formatPrice } from '../../lib/format';
import { useCountdown } from '../hooks/use-countdown';
import { useTrackEvent } from '../hooks/use-track-event';
import { Ratings } from './ratings';
import { AddToCartControls } from './add-to-cart-controls';
import { ImageZoom } from './image-zoom';
import { RelatedProducts } from './related-products';
import { ChatWithSellerButton } from './chat/chat-with-seller-button';
import type { ProductDetail } from '../types';

export function ProductDetails({ product }: { product: ProductDetail }) {
  const [activeImage, setActiveImage] = useState(0);
  const track = useTrackEvent();
  useEffect(() => {
    track('product_view', { productId: product.id });
  }, [product.id, track]);
  const isEvent = Boolean(product.startingDate);
  const countdown = useCountdown(
    isEvent && product.endingDate ? new Date(product.endingDate) : null,
  );
  const onSale = product.salePrice < product.regularPrice;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {product.images[activeImage] && (
            <ImageZoom
              src={product.images[activeImage].fileUrl}
              alt={product.title}
            />
          )}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={
                    i === activeImage
                      ? 'relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-primary'
                      : 'relative size-16 shrink-0 overflow-hidden rounded-lg opacity-70 hover:opacity-100'
                  }
                >
                  <Image
                    src={image.fileUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {isEvent && countdown && (
            <Badge className="w-fit border-transparent bg-tertiary text-on-tertiary">
              {countdown === 'Expired' ? 'Offer ended' : `Ends in ${countdown}`}
            </Badge>
          )}

          <h1 className="text-headline-lg text-on-surface">{product.title}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/shop/${product.shop.id}`}
              className="flex w-fit items-center gap-2 text-label-md text-on-surface-variant hover:text-primary"
            >
              <Store className="size-4" />
              {product.shop.name}
            </Link>
            <ChatWithSellerButton
              shopId={product.shop.id}
              shopName={product.shop.name}
              shopLogoUrl={product.shop.logoUrl}
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                salePrice: product.salePrice,
                imageUrl: product.images[0]?.fileUrl ?? null,
              }}
              size="sm"
            />
          </div>

          <Ratings value={product.ratings} size="md" />

          <div className="flex items-baseline gap-3">
            <span className="text-headline-md text-on-surface">
              {formatPrice(product.salePrice)}
            </span>
            {onSale && (
              <span className="text-body-md text-on-surface-variant line-through">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>

          <p className="text-body-md text-on-surface-variant">
            {product.shortDescription}
          </p>

          <AddToCartControls
            product={product}
            colors={product.colors}
            sizes={product.sizes}
          />

          <div className="grid gap-3 border-t border-outline-variant pt-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Truck className="size-4 shrink-0" />
              {product.cashOnDelivery === 'yes' ? 'Cash on delivery' : 'Prepaid only'}
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <RotateCcw className="size-4 shrink-0" />
              7-day returns
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <ShieldCheck className="size-4 shrink-0" />
              {product.warranty || 'No warranty'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-headline-md text-on-surface">Details</h2>
        <div
          className="prose max-w-none text-body-md text-on-surface-variant"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(product.detailedDescription),
          }}
        />
      </div>

      <RelatedProducts category={product.category} excludeId={product.id} />
    </main>
  );
}
