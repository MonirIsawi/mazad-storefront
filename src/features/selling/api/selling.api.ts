import { httpClient } from '@shared/api';
import {
  productBlockSchema,
  sellerAuctionListSchema,
  sellerAuctionSchema,
  sellerProductListSchema,
  sellerProductSchema,
  storeListSchema,
  storeSchema,
  uploadedImageSchema,
} from '../schemas/selling.schema';
import type {
  AuctionFormValues,
  ProductFormValues,
  SellerAuction,
  SellerProduct,
  Store,
  StoreFormValues,
  UploadedImage,
} from '../types/selling.types';

export const sellingApi = {
  /* ── Stores ───────────────────────────────────────────────────────────────────────────── */

  listStores: async (): Promise<Store[]> => {
    const response = await httpClient.get<unknown>('/me/stores');
    return storeListSchema.parse(response.data);
  },

  createStore: async (values: StoreFormValues): Promise<Store> => {
    const response = await httpClient.post<unknown>('/me/stores', values);
    return storeSchema.parse(response.data);
  },

  updateStore: async (id: string, values: StoreFormValues): Promise<Store> => {
    const response = await httpClient.patch<unknown>(`/me/stores/${id}`, values);
    return storeSchema.parse(response.data);
  },

  /** PATCH /me/stores/:id { coverKey }: an upload key of this seller's, or null to remove it. */
  setStoreCover: async (id: string, coverKey: string | null): Promise<Store> => {
    const response = await httpClient.patch<unknown>(`/me/stores/${id}`, { coverKey });
    return storeSchema.parse(response.data);
  },

  deleteStore: async (id: string): Promise<void> => {
    await httpClient.delete(`/me/stores/${id}`);
  },

  /* ── Products ─────────────────────────────────────────────────────────────────────────── */

  listProducts: async (): Promise<SellerProduct[]> => {
    const response = await httpClient.get<unknown>('/me/products', { params: { limit: 100 } });
    return sellerProductListSchema.parse(response.data).data;
  },

  createProduct: async (values: ProductFormValues): Promise<SellerProduct> => {
    const response = await httpClient.post<unknown>('/products', values);
    return sellerProductSchema.parse(response.data);
  },

  // storeId is create-only: mazad-api's UpdateProductDto has no storeId, so a product cannot be
  // moved between stores after the fact.
  updateProduct: async (
    id: string,
    { storeId: _storeId, ...values }: ProductFormValues,
  ): Promise<SellerProduct> => {
    const response = await httpClient.patch<unknown>(`/products/${id}`, values);
    return sellerProductSchema.parse(response.data);
  },

  /** The owner's view of one product: it adds why Bidoom blocked it (absent from /me/products). */
  getProductBlockReason: async (id: string): Promise<string | null> => {
    const response = await httpClient.get<unknown>(`/products/${id}`);
    return productBlockSchema.parse(response.data).blockReason ?? null;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await httpClient.delete(`/products/${id}`);
  },

  /* ── Images ───────────────────────────────────────────────────────────────────────────── */

  uploadImage: async (file: File): Promise<UploadedImage> => {
    const body = new FormData();
    body.append('file', file);
    // Content-Type is deleted rather than set: the browser has to generate the multipart
    // boundary itself, and httpClient's JSON default would override it.
    const response = await httpClient.post<unknown>('/uploads', body, {
      headers: { 'Content-Type': undefined },
    });
    return uploadedImageSchema.parse(response.data);
  },

  addProductImage: async (
    productId: string,
    payload: { key: string; isCover?: boolean; sortOrder?: number },
  ): Promise<void> => {
    await httpClient.post(`/products/${productId}/images`, payload);
  },

  removeProductImage: async (productId: string, imageId: string): Promise<void> => {
    await httpClient.delete(`/products/${productId}/images/${imageId}`);
  },

  /* ── Auctions ─────────────────────────────────────────────────────────────────────────── */

  listAuctions: async (): Promise<SellerAuction[]> => {
    const response = await httpClient.get<unknown>('/me/auctions');
    return sellerAuctionListSchema.parse(response.data);
  },

  createAuction: async (values: AuctionFormValues): Promise<SellerAuction> => {
    const response = await httpClient.post<unknown>('/auctions', values);
    return sellerAuctionSchema.parse(response.data);
  },

  // productId is fixed once the auction exists — UpdateAuctionDto only carries pricing and dates.
  updateAuction: async (
    id: string,
    { productId: _productId, ...values }: AuctionFormValues,
  ): Promise<SellerAuction> => {
    const response = await httpClient.patch<unknown>(`/auctions/${id}`, values);
    return sellerAuctionSchema.parse(response.data);
  },

  submitAuction: async (id: string): Promise<SellerAuction> => {
    const response = await httpClient.post<unknown>(`/auctions/${id}/submit`);
    return sellerAuctionSchema.parse(response.data);
  },

  cancelAuction: async (id: string, reason?: string): Promise<SellerAuction> => {
    const response = await httpClient.post<unknown>(`/auctions/${id}/cancel`, { reason });
    return sellerAuctionSchema.parse(response.data);
  },
};
