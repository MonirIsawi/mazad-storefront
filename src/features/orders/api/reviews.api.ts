import { httpClient } from '@shared/api';

export interface ReviewInput {
  rating: number;
  tags: string[];
  comment: string | null;
}

/** The buyer's store rating of one order item (Bidoom API). */
export const reviewsApi = {
  create: async (orderItemId: string, input: ReviewInput): Promise<void> => {
    await httpClient.post(`/order-items/${orderItemId}/review`, {
      rating: input.rating,
      tags: input.tags,
      ...(input.comment ? { comment: input.comment } : {}),
    });
  },

  /** Until `editableUntil`; `comment: null` clears it. */
  update: async (reviewId: string, input: ReviewInput): Promise<void> => {
    await httpClient.patch(`/reviews/${reviewId}`, input);
  },
};
