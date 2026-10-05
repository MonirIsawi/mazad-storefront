'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useLocale, useToast } from '@shared/hooks';
import { formatMoney } from '@shared/lib';
import { biddingApi } from '../api/bidding.api';
import { useBiddingTranslation } from './useBiddingTranslation';

export function usePlaceBid(auctionId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { locale } = useLocale();
  const { t } = useBiddingTranslation();

  return useMutation({
    mutationFn: ({ amount, idempotencyKey }: { amount: number; idempotencyKey: string }) =>
      biddingApi.placeBid(auctionId, amount, idempotencyKey),
    onSuccess: (_data, { amount: submittedAmount }) => {
      // The response's own id/amount can silently belong to another bidder's auto-bid
      // counter-offer (see bidding.schema.ts), so the confirmation echoes what *this* user
      // submitted and the real standing is reconciled from the refetches below.
      toast.bid(t('toast.bidPlaced'), formatMoney(String(submittedAmount), locale));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auction(auctionId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auctionBids(auctionId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bidding.auctionPricing(auctionId),
      });
    },
  });
}
