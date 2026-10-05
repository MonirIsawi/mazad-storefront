'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { biddingApi } from '../api/bidding.api';
import { useBiddingTranslation } from './useBiddingTranslation';

export function useBuyNow(auctionId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useBiddingTranslation();

  return useMutation({
    mutationFn: (idempotencyKey: string) => biddingApi.buyNow(auctionId, idempotencyKey),
    onSuccess: () => {
      toast.success(t('toast.boughtNow'));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auction(auctionId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auctionBids(auctionId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bidding.auctionPricing(auctionId),
      });
    },
  });
}
