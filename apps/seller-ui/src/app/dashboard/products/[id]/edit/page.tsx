'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../../lib/api';
import { ProductForm } from '../../../../../components/create-product/product-form';
import type { CreateProductForm } from '../../../../../components/create-product/types';

interface ApiProduct {
  id: string;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  subcategory: string;
  brand: string | null;
  videoUrl: string | null;
  tags: string[];
  warranty: string | null;
  regularPrice: number;
  salePrice: number;
  stock: number;
  cashOnDelivery: string;
  colors: string[];
  sizes: string[];
  images: { fileId: string; fileUrl: string }[];
  customSpecifications: { name: string; value: string }[] | null;
  customProperties: { label: string; values: string[] }[] | null;
  discountCodes: string[];
  startingDate: string | null;
  endingDate: string | null;
}

function toFormValues(p: ApiProduct): CreateProductForm {
  return {
    title: p.title,
    shortDescription: p.shortDescription,
    detailedDescription: p.detailedDescription,
    category: p.category,
    subcategory: p.subcategory,
    brand: p.brand ?? '',
    videoUrl: p.videoUrl ?? '',
    tags: p.tags.join(', '),
    warranty: p.warranty ?? '',
    regularPrice: String(p.regularPrice),
    salePrice: String(p.salePrice),
    stock: String(p.stock),
    cashOnDelivery: p.cashOnDelivery,
    colors: p.colors,
    sizes: p.sizes,
    images: p.images.map(({ fileId, fileUrl }) => ({ fileId, fileUrl })),
    customSpecifications: p.customSpecifications ?? [],
    customProperties: p.customProperties ?? [],
    discountCodes: p.discountCodes,
    startingDate: p.startingDate ? p.startingDate.slice(0, 10) : '',
    endingDate: p.endingDate ? p.endingDate.slice(0, 10) : '',
  };
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const api = useApi();

  const {
    data: product,
    isPending,
    isError,
  } = useQuery<ApiProduct>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/product/api/products/${id}`);
      return data.product;
    },
  });

  if (isPending) {
    return (
      <p className="text-body-md text-on-surface-variant">Loading product…</p>
    );
  }
  if (isError || !product) {
    return <p className="text-body-md text-error">Product not found.</p>;
  }

  const isEvent = Boolean(product.startingDate);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">
          Edit {isEvent ? 'event' : 'product'}
        </h1>
        <p className="text-body-md text-on-surface-variant">{product.title}</p>
      </div>
      <ProductForm
        mode="edit"
        isEvent={isEvent}
        productId={product.id}
        defaultValues={toFormValues(product)}
      />
    </div>
  );
}
