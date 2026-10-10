'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useLocale, useToast } from '@shared/hooks';
import { formatMoney } from '@shared/lib';
import { biddingApi } from '../api/bidding.api';
import { applyBidResult } from '../lib/apply-bid-result';
import { useBiddingTranslation } from './useBiddingTranslation';

export function usePlaceBid(auctionId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { locale } = useLocale();
  const { t } = useBiddingTranslation();

  return useMutation({
    mutationFn: ({ amount, idempotencyKey }: { amount: number; idempotencyKey: string }) =>
      biddingApi.placeBid(auctionId, amount, idempotencyKey),
    onSuccess: (data, { amount: submittedAmount }) => {
      // Another bidder's auto-bid can answer at once (mazad-api reports it): say so instead of
      // a "bid placed" that reads like the user now leads.
      if (data.leading === false && data.outbidByAutoBid) {
        toast.error(
          t('toast.outbidByAutoBid'),
          data.auction.minNextBid
            ? t('toast.nextMinimum', { amount: formatMoney(data.auction.minNextBid, locale) })
            : undefined,
        );
      } else {
        toast.bid(t('toast.bidPlaced'), formatMoney(String(submittedAmount), locale));
      }
      if (data.extended && data.extensionMinutes) {
        toast.info(t('toast.extended', { count: data.extensionMinutes }));
      }
      applyBidResult(queryClient, auctionId, data.auction);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auction(auctionId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.auctionBids(auctionId) });
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bidding.auctionPricing(auctionId),
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bidding.myStanding(auctionId) });
    },
  });
}
