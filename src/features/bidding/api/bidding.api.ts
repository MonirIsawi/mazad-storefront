import { httpClient } from '@shared/api';
import {
  bidResponseSchema,
  autoBidResponseSchema,
  autoBidCancelResponseSchema,
  auctionPricingSchema,
  myBidsListSchema,
  myStandingSchema,
} from '../schemas/bidding.schema';
import type {
  BidResponse,
  AutoBidResponse,
  AutoBidCancelResponse,
  AuctionPricing,
  MyBidsList,
  MyBidsParams,
  MyStanding,
} from '../types/bidding.types';

export const biddingApi = {
  getAuctionPricing: async (auctionId: string): Promise<AuctionPricing> => {
    const response = await httpClient.get<unknown>(`/auctions/${auctionId}`);
    return auctionPricingSchema.parse(response.data);
  },

  /** `idempotencyKey` identifies one bid intent: a retry with the same key never bids twice. */
  placeBid: async (
    auctionId: string,
    amount: number,
    idempotencyKey?: string,
  ): Promise<BidResponse> => {
    const response = await httpClient.post<unknown>(
      `/auctions/${auctionId}/bids`,
      { amount },
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
    );
    return bidResponseSchema.parse(response.data);
  },

  buyNow: async (auctionId: string, idempotencyKey?: string): Promise<BidResponse> => {
    const response = await httpClient.post<unknown>(
      `/auctions/${auctionId}/buy-now`,
      undefined,
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
    );
    return bidResponseSchema.parse(response.data);
  },

  setAutoBid: async (auctionId: string, maxAmount: number): Promise<AutoBidResponse> => {
    const response = await httpClient.put<unknown>(`/auctions/${auctionId}/auto-bid`, {
      maxAmount,
    });
    return autoBidResponseSchema.parse(response.data);
  },

  cancelAutoBid: async (auctionId: string): Promise<AutoBidCancelResponse> => {
    const response = await httpClient.delete<unknown>(`/auctions/${auctionId}/auto-bid`);
    return autoBidCancelResponseSchema.parse(response.data);
  },

  /** The signed-in user's standing on one auction: leading, highest bid, auto-bid. */
  getMyStanding: async (auctionId: string): Promise<MyStanding> => {
    const response = await httpClient.get<unknown>(`/auctions/${auctionId}/me`);
    return myStandingSchema.parse(response.data);
  },

  listMyBids: async (params: MyBidsParams): Promise<MyBidsList> => {
    const response = await httpClient.get<unknown>('/me/bids', { params });
    return myBidsListSchema.parse(response.data);
  },
};
