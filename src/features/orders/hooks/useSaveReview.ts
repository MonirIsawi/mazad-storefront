'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { reviewsApi, type ReviewInput } from '../api/reviews.api';
import { useOrdersTranslation } from './useOrdersTranslation';

/** Posts a new rating or saves the edit of an existing one, then re-reads the order. */
export function useSaveReview(orderId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useOrdersTranslation();

  return useMutation({
    mutationFn: ({
      orderItemId,
      reviewId,
      input,
    }: {
      orderItemId: string;
      reviewId?: string;
      input: ReviewInput;
    }) => (reviewId ? reviewsApi.update(reviewId, input) : reviewsApi.create(orderItemId, input)),
    onSuccess: (_data, { reviewId }) => {
      toast.success(t(reviewId ? 'rating.updated' : 'rating.posted'));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.list });
    },
  });
}
