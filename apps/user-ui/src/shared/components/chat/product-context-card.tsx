'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { formatPrice } from '../../../lib/format';

export interface ProductContext {
  id: string;
  title: string;
  slug: string;
  salePrice: number;
  imageUrl: string | null;
}

export function ProductContextCard({
  product,
  label,
}: {
  product: ProductContext;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <Package className="absolute inset-0 m-auto size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Link
          href={`/product/${product.slug}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {product.title}
        </Link>
      </div>
      <span className="shrink-0 text-sm font-medium">{formatPrice(product.salePrice)}</span>
    </div>
  );
}
