import { STORE_REVIEW_TAGS } from '../schemas/store.schema';
import type { StoreReviewTag } from '../types/store.types';

function isKnownTag(tag: string): tag is StoreReviewTag {
  return (STORE_REVIEW_TAGS as readonly string[]).includes(tag);
}

/**
 * The translation key for a review tag, or null for a tag this client doesn't know yet. The labels
 * live in the common namespace so the store ratings tab and the rating sheet (orders) read one source.
 */
export function reviewTagKey(tag: string): string | null {
  return isKnownTag(tag) ? `common:reviewTags.${tag}` : null;
}
