'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { sellingApi } from '../api/selling.api';
import { useSellingTranslation } from './useSellingTranslation';
import type { ProductFormValues } from '../types/selling.types';

export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEYS.selling.products,
    queryFn: sellingApi.listProducts,
  });
}

/** Why a blocked product is blocked: fetched only for blocked rows. */
export function useProductBlockReason(id: string, isBlocked: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEYS.selling.products, id, 'blockReason'],
    queryFn: () => sellingApi.getProductBlockReason(id),
    enabled: isBlocked,
    staleTime: 5 * 60_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: (values: ProductFormValues) => sellingApi.createProduct(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      // The first product auto-creates a default store server-side, so the list can change too.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.stores });
      toast.success(t('toast.productCreated'));
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      sellingApi.updateProduct(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      toast.success(t('toast.productUpdated'));
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: (id: string) => sellingApi.deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      toast.success(t('toast.productDeleted'));
    },
  });
}

/**
 * Upload then attach: `POST /uploads` stores the file and hands back a key, and only
 * `POST /products/:id/images` turns that key into an image on the product. Both halves live in
 * one mutation so a caller can't leave an orphaned upload behind by forgetting the second.
 */
export function useAddProductImage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      isCover,
    }: {
      productId: string;
      file: File;
      isCover: boolean;
      /** A batch after creating the product says so once, not per photo. */
      silent?: boolean;
    }) => {
      const uploaded = await sellingApi.uploadImage(file);
      await sellingApi.addProductImage(productId, { key: uploaded.key, isCover });
    },
    onSuccess: (_result, { silent }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      if (!silent) toast.success(t('toast.photoAdded'));
    },
  });
}

export function useRemoveProductImage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useSellingTranslation();

  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      sellingApi.removeProductImage(productId, imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.selling.products });
      toast.success(t('toast.photoRemoved'));
    },
  });
}
