'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { sellingApi } from '../api/selling.api';
import { useSellingTranslation } from './useSellingTranslation';
import type { StoreFormValues } from '../types/selling.types';

export function useStores() {
  return useQuery({
    queryKey: QUERY_KEYS.selling.stores,
    queryFn: sellingApi.listStores,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: (values: StoreFormValues) => sellingApi.createStore(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.stores });
      toast.success(t('toast.storeCreated'));
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StoreFormValues }) =>
      sellingApi.updateStore(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.stores });
      toast.success(t('toast.storeUpdated'));
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: (id: string) => sellingApi.deleteStore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.stores });
      // Products carry their store's name, so a deletion invalidates them too.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      toast.success(t('toast.storeDeleted'));
    },
  });
}

/** Upload then set the store's cover (the product-photo upload flow); `file: null` removes it. */
export function useStoreCover() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: async ({ storeId, file }: { storeId: string; file: File | null }) => {
      const key = file ? (await sellingApi.uploadImage(file)).key : null;
      return sellingApi.setStoreCover(storeId, key);
    },
    onSuccess: (_store, { file }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.stores });
      toast.success(t(file ? 'toast.coverUpdated' : 'toast.coverRemoved'));
    },
  });
}
