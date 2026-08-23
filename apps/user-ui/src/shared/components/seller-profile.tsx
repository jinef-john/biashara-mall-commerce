'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Show } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Calendar, Globe, Loader2, MapPin, Store } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@biashara-mall/ui/components/ui/alert-dialog';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@biashara-mall/ui/components/ui/tabs';
import { useApi } from '../../lib/api';
import { useProducts, useEvents } from '../../lib/queries';
import { useTrackEvent } from '../hooks/use-track-event';
import { Ratings } from './ratings';
import { ProductCard } from './cards/product-card';
import { ProductGridSkeleton } from './skeletons';
import type { ShopSummary } from '../types';

interface ShopReview {
  id: string;
  rating: number;
  review: string | null;
  createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

interface SellerData {
  shop: ShopSummary & { reviews: ShopReview[] };
  isFollowing: boolean;
}

const TAB_TRIGGER =
  'px-4 font-medium data-[state=active]:bg-primary data-[state=active]:text-on-primary';

function ProductsTab({ shopId }: { shopId: string }) {
  const { data, isPending } = useProducts({ shopId, limit: 20 });
  if (isPending) return <ProductGridSkeleton />;
  if (!data?.products.length) {
    return (
      <p className="text-body-md text-on-surface-variant">No products yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data.products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function OffersTab({ shopId }: { shopId: string }) {
  const { data, isPending } = useEvents({ shopId, limit: 20 });
  if (isPending) return <ProductGridSkeleton />;
  if (!data?.products.length) {
    return (
      <p className="text-body-md text-on-surface-variant">
        No offers right now.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {data.products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: ShopReview[] }) {
  if (!reviews.length) {
    return (
      <p className="text-body-md text-on-surface-variant">No reviews yet.</p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-outline-variant pb-4">
          <div className="flex items-center gap-2">
            <span className="text-label-md text-on-surface">
              {review.user.name ?? 'Anonymous'}
            </span>
            <Ratings value={review.rating} size="sm" />
          </div>
          {review.review && (
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {review.review}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function SellerProfile({
  shopId,
  initial,
}: {
  shopId: string;
  initial: SellerData;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const track = useTrackEvent();
  useEffect(() => {
    track('shop_visit', { shopId });
  }, [shopId, track]);

  // Seeded with the server-rendered payload for instant paint, then refetched
  // through the authenticated client so `isFollowing` reflects the viewer.
  const { data } = useQuery<SellerData>({
    queryKey: ['seller', shopId, 'authed'],
    queryFn: async () => {
      const { data } = await api.get(`/seller/api/get-seller/${shopId}`);
      return data;
    },
    initialData: initial,
  });

  const shop = data!.shop;
  const following = data!.isFollowing;
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);

  const follow = useMutation({
    mutationFn: async () => {
      // Floored so the spinner is visible; otherwise the button reads as dead.
      const [response] = await Promise.all([
        following
          ? api.post('/seller/api/unfollow-shop', { shopId })
          : api.post('/seller/api/follow-shop', { shopId }),
        new Promise((resolve) => setTimeout(resolve, 700)),
      ]);
      return response;
    },
    onSuccess: () => {
      queryClient.setQueryData<SellerData>(
        ['seller', shopId, 'authed'],
        (current) =>
          current
            ? {
                ...current,
                isFollowing: !following,
                shop: {
                  ...current.shop,
                  _count: {
                    ...current.shop._count,
                    followers:
                      current.shop._count.followers + (following ? -1 : 1),
                  },
                },
              }
            : current,
      );
    },
    onError: () => toast.error('Could not update follow status'),
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="relative h-40 overflow-hidden rounded-xl bg-surface-container sm:h-56">
        {shop.coverUrl && (
          <Image
            src={shop.coverUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="-mt-16 flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-container-low">
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={shop.name}
                width={96}
                height={96}
                className="size-full object-cover"
              />
            ) : (
              <Store className="size-8 text-on-surface-variant" />
            )}
          </div>
          <div>
            <h1 className="text-headline-lg text-on-surface">{shop.name}</h1>
            {shop.category && (
              <span className="text-body-sm text-on-surface-variant">
                {shop.category}
              </span>
            )}
          </div>
        </div>

        <Show when="signed-in">
          <Button
            type="button"
            variant={following ? 'outline' : 'default'}
            disabled={follow.isPending}
            onClick={() =>
              following ? setConfirmUnfollow(true) : follow.mutate()
            }
          >
            {follow.isPending && <Loader2 className="animate-spin" />}
            {following ? 'Following' : 'Follow'}
          </Button>
        </Show>

        <AlertDialog open={confirmUnfollow} onOpenChange={setConfirmUnfollow}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unfollow {shop.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll stop getting this shop's new products and offers in your
                feed. You can follow again at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => follow.mutate()}>
                Unfollow
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {shop.bio && (
        <p className="text-body-md text-on-surface-variant">{shop.bio}</p>
      )}

      <div className="flex flex-wrap gap-4 text-body-sm text-on-surface-variant">
        {shop.address && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" />
            {shop.address}
            {shop.country ? `, ${shop.country}` : ''}
          </span>
        )}
        {shop.website && (
          <a
            href={shop.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <Globe className="size-4" />
            Website
          </a>
        )}
        <span className="flex items-center gap-1.5">
          <Calendar className="size-4" />
          Joined{' '}
          {new Date(shop.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          })}
        </span>
        <Badge variant="secondary">{shop._count.products} products</Badge>
        <Badge variant="secondary">{shop._count.followers} followers</Badge>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="border border-outline-variant bg-surface-container">
          <TabsTrigger value="products" className={TAB_TRIGGER}>
            Products
          </TabsTrigger>
          <TabsTrigger value="offers" className={TAB_TRIGGER}>
            Offers
          </TabsTrigger>
          <TabsTrigger value="reviews" className={TAB_TRIGGER}>
            Reviews
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-4">
          <ProductsTab shopId={shopId} />
        </TabsContent>
        <TabsContent value="offers" className="pt-4">
          <OffersTab shopId={shopId} />
        </TabsContent>
        <TabsContent value="reviews" className="pt-4">
          <ReviewsTab reviews={shop.reviews} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
