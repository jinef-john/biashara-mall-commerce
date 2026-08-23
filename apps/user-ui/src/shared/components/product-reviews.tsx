import { Ratings } from './ratings';
import type { ProductReviewSummary } from '../types';

export function ProductReviews({
  reviews,
  rating,
}: {
  reviews: ProductReviewSummary[];
  rating: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-headline-md text-on-surface">Reviews</h2>
        {reviews.length > 0 && (
          <Ratings value={rating} count={reviews.length} size="md" />
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-outline-variant pb-4 last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-label-md text-on-surface">
                  {review.user.name ?? 'Anonymous'}
                </span>
                <Ratings value={review.rating} size="sm" />
                <span className="text-label-sm text-on-surface-variant">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.review && (
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {review.review}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
