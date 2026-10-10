'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { sellingApi } from '../api/selling.api';
import { useSellingTranslation } from './useSellingTranslation';
import type { AuctionFormValues } from '../types/selling.types';

export function useSellerAuctions() {
  return useQuery({
    queryKey: QUERY_KEYS.selling.auctions,
    queryFn: sellingApi.listAuctions,
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    // `silent`: publishing goes on to submit, whose toast says what happened.
    mutationFn: ({ values }: { values: AuctionFormValues; silent?: boolean }) =>
      sellingApi.createAuction(values),
    onSuccess: (_auction, { silent }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.auctions });
      if (!silent) toast.success(t('toast.auctionDraftSaved'));
    },
  });
}

export function useUpdateAuction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AuctionFormValues; silent?: boolean }) =>
      sellingApi.updateAuction(id, values),
    onSuccess: (_auction, { silent }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.auctions });
      if (!silent) toast.success(t('toast.auctionUpdated'));
    },
  });
}

export function useSubmitAuction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: (id: string) => sellingApi.submitAuction(id),
    onSuccess: (auction) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.auctions });
      // Published at once, or waiting for Mazad's review: say which.
      toast.success(
        t(
          auction.status === 'PENDING_APPROVAL'
            ? 'toast.auctionSentForReview'
            : 'toast.auctionPublished',
        ),
      );
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      sellingApi.cancelAuction(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.auctions });
      // Cancelling frees the product to be auctioned again, which the product list reflects.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      toast.success(t('toast.auctionCancelled'));
    },
  });
}
