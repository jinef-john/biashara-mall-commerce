'use client';

import { useState } from 'react';
import { Check, Heart, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Toggle } from '@biashara-mall/ui/components/ui/toggle';
import { cn } from '@biashara-mall/ui/lib/utils';
import { useStore } from '../../store';
import { useCartActions } from '../hooks/use-cart-actions';
import type { ProductCardData, ProductDetail } from '../types';

function isLight(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export function AddToCartControls({
  product,
  colors = [],
  sizes = [],
}: {
  product: ProductCardData | ProductDetail;
  colors?: string[];
  sizes?: string[];
}) {
  const [color, setColor] = useState<string | undefined>(colors[0]);
  const [size, setSize] = useState<string | undefined>(sizes[0]);
  const [quantity, setQuantity] = useState(1);

  const { addToCart, addToWishlist, removeFromWishlist } = useCartActions();
  const inWishlist = useStore((s) => s.wishlist.some((i) => i.id === product.id));

  const outOfStock = product.stock <= 0;

  const lineItem = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    imageUrl: product.images[0]?.fileUrl,
    price: product.salePrice,
    color,
    size,
    shopId: product.shop.id,
    shopName: product.shop.name,
  };

  return (
    <div className="flex flex-col gap-4">
      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">Color</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <Toggle
                key={c}
                variant="outline"
                size="sm"
                pressed={color === c}
                onPressedChange={() => setColor(c)}
                aria-label={c}
                title={c}
                className="size-8 rounded-full border-outline-variant p-0 hover:opacity-80 data-[state=on]:bg-transparent data-[state=on]:ring-2 data-[state=on]:ring-primary"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <Check className={isLight(c) ? 'text-black' : 'text-white'} />
                )}
              </Toggle>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-label-md text-on-surface">Size</span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Toggle
                key={s}
                variant="outline"
                pressed={size === s}
                onPressedChange={() => setSize(s)}
              >
                {s}
              </Toggle>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-outline-variant">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center text-body-md tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          >
            <Plus />
          </Button>
        </div>

        <Button
          type="button"
          className="flex-1"
          disabled={outOfStock}
          onClick={() => {
            addToCart({ ...lineItem, quantity });
            toast.success(`${product.title} added to cart`);
          }}
        >
          {outOfStock ? 'Out of stock' : 'Add to Cart'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={() =>
            inWishlist
              ? removeFromWishlist(product.id)
              : addToWishlist({ ...lineItem, quantity: 1 })
          }
        >
          <Heart className={cn(inWishlist && 'fill-red-500 text-red-500')} />
        </Button>
      </div>
    </div>
  );
}
