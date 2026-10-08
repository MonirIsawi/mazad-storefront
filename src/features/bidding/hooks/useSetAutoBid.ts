'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { biddingApi } from '../api/bidding.api';
import { applyBidResult } from '../lib/apply-bid-result';
import { useBiddingTranslation } from './useBiddingTranslation';

export function useSetAutoBid(auctionId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useBiddingTranslation();

  return useMutation({
    mutationFn: (maxAmount: number) => biddingApi.setAutoBid(auctionId, maxAmount),
    onSuccess: (data) => {
      toast.success(t('toast.autoBidSet'));
      // Setting an auto-bid can bid at once (when someone else leads); then show that too.
      if (data.bid) applyBidResult(queryClient, auctionId, data.bid.auction);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auction(auctionId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auctionBids(auctionId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bidding.auctionPricing(auctionId),
      });
    },
  });
}
