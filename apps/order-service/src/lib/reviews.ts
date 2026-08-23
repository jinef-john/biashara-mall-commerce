/** A product with no reviews keeps the schema's optimistic default rather than
 * falling to zero, which would rank it below everything ever reviewed. */
export const DEFAULT_RATING = 5;

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return DEFAULT_RATING;
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/** Whole and half stars between 1 and 5; anything else is a client bug. */
export function parseRating(value: unknown): number | null {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return Math.round(rating * 2) === rating * 2 ? rating : null;
}

export const MAX_REVIEW_LENGTH = 2000;

export function parseReviewText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.slice(0, MAX_REVIEW_LENGTH) || null;
}
