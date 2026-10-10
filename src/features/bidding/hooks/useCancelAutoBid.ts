'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks';
import { QUERY_KEYS } from '@shared/constants';
import { biddingApi } from '../api/bidding.api';
import { useBiddingTranslation } from './useBiddingTranslation';

export function useCancelAutoBid(auctionId: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { t } = useBiddingTranslation();

  return useMutation({
    mutationFn: () => biddingApi.cancelAutoBid(auctionId),
    onSuccess: () => {
      toast.success(t('toast.autoBidCancelled'));
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bidding.myStanding(auctionId) });
    },
  });
}
