import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '../../../lib/server-api';
import { ProductDetails } from '../../../shared/components/product-details';
import type { ProductDetail } from '../../../shared/types';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const data = await serverGet<{ product: ProductDetail }>(
    `/product/api/get-product/${slug}`,
  );
  return data?.product ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: 'Product not found — Biashara Mall' };
  }

  const image = product.images[0]?.fileUrl;

  return {
    title: `${product.title} — Biashara Mall`,
    description: product.shortDescription,
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.shortDescription,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return <ProductDetails product={product} />;
}
