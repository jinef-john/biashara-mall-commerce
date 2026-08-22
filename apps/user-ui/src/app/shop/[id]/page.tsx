import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet } from '../../../lib/server-api';
import { SellerProfile } from '../../../shared/components/seller-profile';
import { SuspendedGate } from '../../../shared/components/suspended-gate';
import type { ShopSummary } from '../../../shared/types';

interface Props {
  params: Promise<{ id: string }>;
}

interface ShopReview {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

async function getSeller(id: string) {
  return serverGet<{
    shop: ShopSummary & { reviews: ShopReview[] };
    isFollowing: boolean;
  }>(`/seller/api/get-seller/${id}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getSeller(id);

  if (!data) {
    return { title: 'Shop not found | Biashara Mall' };
  }

  const { shop } = data;

  return {
    title: `${shop.name} | Biashara Mall`,
    description: shop.bio ?? `Shop ${shop.name} on Biashara Mall.`,
    openGraph: {
      title: shop.name,
      description: shop.bio ?? undefined,
      images: shop.logoUrl ? [shop.logoUrl] : undefined,
    },
  };
}

export default async function ShopPage({ params }: Props) {
  const { id } = await params;
  const data = await getSeller(id);

  if (!data) notFound();

  return (
    <SuspendedGate>
      <SellerProfile shopId={id} initial={data} />
    </SuspendedGate>
  );
}
