import { STORE_REVIEW_TAGS } from '../schemas/store.schema';
import type { StoreReviewTag } from '../types/store.types';

function isKnownTag(tag: string): tag is StoreReviewTag {
  return (STORE_REVIEW_TAGS as readonly string[]).includes(tag);
}

/** The translation key for a review tag, or null for a tag this client doesn't know yet. */
export function reviewTagKey(tag: string): string | null {
  return isKnownTag(tag) ? `store.tags.${tag}` : null;
}
