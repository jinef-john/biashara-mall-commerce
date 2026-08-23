import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_RATING,
  MAX_REVIEW_LENGTH,
  averageRating,
  parseRating,
  parseReviewText,
} from '../apps/order-service/src/lib/reviews';

describe('averageRating', () => {
  test('an unreviewed product keeps the optimistic default, not zero', () => {
    expect(averageRating([])).toBe(DEFAULT_RATING);
  });

  test('averages what is there', () => {
    expect(averageRating([5, 4])).toBe(4.5);
    expect(averageRating([1])).toBe(1);
  });

  test('rounds to one decimal', () => {
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });

  test('one bad review drags a perfect score down', () => {
    expect(averageRating([5, 5, 5, 1])).toBe(4);
  });
});

describe('parseRating', () => {
  test.each([1, 2.5, 3, 5])('accepts %p', (value) => {
    expect(parseRating(value)).toBe(value);
  });

  test('accepts a numeric string, since it arrives over JSON', () => {
    expect(parseRating('4')).toBe(4);
  });

  test.each([
    ['zero', 0],
    ['above five', 6],
    ['negative', -3],
    ['a third of a star', 3.3],
    ['not a number', 'great'],
    ['nothing at all', undefined],
  ])('rejects %s', (_label, value) => {
    expect(parseRating(value)).toBeNull();
  });
});

describe('parseReviewText', () => {
  test('trims surrounding whitespace', () => {
    expect(parseReviewText('  solid  ')).toBe('solid');
  });

  test('whitespace only is no review at all', () => {
    expect(parseReviewText('   ')).toBeNull();
    expect(parseReviewText('')).toBeNull();
  });

  test('missing text is allowed — a rating alone is a valid review', () => {
    expect(parseReviewText(undefined)).toBeNull();
    expect(parseReviewText(null)).toBeNull();
  });

  test('caps length rather than rejecting an over-long review', () => {
    expect(parseReviewText('x'.repeat(5000))).toHaveLength(MAX_REVIEW_LENGTH);
  });
});
