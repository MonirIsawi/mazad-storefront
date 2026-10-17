/**
 * Store-rating rules as the API enforces them (API-CONTRACT-FINAL "Store ratings"): praise tags go
 * with 4-5 stars, problem tags with 1-3, at most three per rating.
 */
export const PRAISE_TAGS = [
  'AS_DESCRIBED',
  'FAST_DELIVERY',
  'GOOD_PACKAGING',
  'FRIENDLY_SELLER',
  'GOOD_VALUE',
] as const;
export const PROBLEM_TAGS = [
  'NOT_AS_DESCRIBED',
  'LATE_DELIVERY',
  'POOR_PACKAGING',
  'UNRESPONSIVE_SELLER',
  'DAMAGED',
] as const;
export const MAX_REVIEW_TAGS = 3;
export const REVIEW_COMMENT_MAX_LENGTH = 2000;

export type ReviewTag = (typeof PRAISE_TAGS)[number] | (typeof PROBLEM_TAGS)[number];

export function tagsForRating(rating: number): readonly ReviewTag[] {
  return rating >= 4 ? PRAISE_TAGS : PROBLEM_TAGS;
}

/** Keeps only the tags that still fit the rating's band (the stars moved across the line). */
export function tagsInBand(rating: number, tags: readonly string[]): ReviewTag[] {
  const allowed = new Set<string>(tagsForRating(rating));
  return tags.filter((tag): tag is ReviewTag => allowed.has(tag));
}

type RateableItem = {
  canReview?: boolean;
  review?: { id: string } | null;
};

/**
 * The item the rating card is about: the first one rated or still open to rating. Undefined when
 * the API has no ratings (no `canReview` field at all) or nothing can be rated: the card is hidden.
 */
export function rateableItem<T extends RateableItem>(items: T[]): T | undefined {
  if (!items.some((item) => item.canReview !== undefined)) return undefined;
  return items.find((item) => item.review) ?? items.find((item) => item.canReview === true);
}
