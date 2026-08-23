'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { useApi } from '../../lib/api';
import { Ratings } from './ratings';
import { ReviewDialog, type ExistingReview } from './review-dialog';

interface ReviewableOrder {
  canReview: boolean;
  shop: { id: string; name: string } | null;
  items: { productId: string; title: string; review: ExistingReview | null }[];
  shopReview: ExistingReview | null;
}

type Target =
  | {
      kind: 'product';
      productId: string;
      title: string;
      existing: ExistingReview | null;
    }
  | { kind: 'shop'; title: string; existing: ExistingReview | null };

export function OrderReviews({ orderId }: { orderId: string }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Target | null>(null);

  const { data, isPending } = useQuery<ReviewableOrder>({
    queryKey: ['order-reviews', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/order/api/reviews/order/${orderId}`);
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async ({
      rating,
      review,
    }: {
      rating: number;
      review: string;
    }) => {
      if (!target) return;
      const path = target.kind === 'shop' ? 'shop' : 'product';
      await api.post(`/order/api/reviews/${path}`, {
        orderId,
        rating,
        review,
        ...(target.kind === 'product' ? { productId: target.productId } : {}),
      });
    },
    onSuccess: () => {
      toast.success('Thanks for the review');
      setTarget(null);
      queryClient.invalidateQueries({ queryKey: ['order-reviews', orderId] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save your review';
      toast.error(message);
    },
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!data?.canReview) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div>
        <h2 className="text-title-md text-on-surface">Reviews</h2>
        <p className="text-body-sm text-on-surface-variant">
          This order was delivered, so you can review what you bought.
        </p>
      </div>

      {data.items.map((item) => (
        <div key={item.productId} className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md text-on-surface">
              {item.title}
            </p>
            {item.review && <Ratings value={item.review.rating} size="sm" />}
          </div>
          <Button
            variant={item.review ? 'outline' : 'default'}
            size="sm"
            onClick={() =>
              setTarget({
                kind: 'product',
                productId: item.productId,
                title: item.title,
                existing: item.review,
              })
            }
          >
            <Star className="size-4" />
            {item.review ? 'Edit review' : 'Write a review'}
          </Button>
        </div>
      ))}

      {data.shop && (
        <div className="flex flex-wrap items-center gap-3 border-t border-outline-variant pt-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md text-on-surface">
              {data.shop.name}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {data.shopReview
                ? 'Your rating for this seller'
                : 'Rate the seller'}
            </p>
            {data.shopReview && (
              <Ratings value={data.shopReview.rating} size="sm" />
            )}
          </div>
          <Button
            variant={data.shopReview ? 'outline' : 'default'}
            size="sm"
            onClick={() =>
              setTarget({
                kind: 'shop',
                title: data.shop!.name,
                existing: data.shopReview,
              })
            }
          >
            <Star className="size-4" />
            {data.shopReview ? 'Edit review' : 'Rate seller'}
          </Button>
        </div>
      )}

      <ReviewDialog
        open={target !== null}
        onOpenChange={(open) => !open && setTarget(null)}
        title={
          target?.kind === 'shop' ? 'Rate this seller' : 'Review this product'
        }
        subject={target?.title ?? ''}
        existing={target?.existing ?? null}
        pending={submit.isPending}
        onSubmit={(rating, review) => submit.mutate({ rating, review })}
      />
    </div>
  );
}
