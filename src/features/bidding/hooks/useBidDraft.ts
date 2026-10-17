'use client';

import { useRef, useState } from 'react';
import { newIdempotencyKey, parseMoney, roundMoney } from '@shared/lib';
import { computeMinimumBid } from '../lib/computeMinimumBid';
import type { AuctionPricing } from '../types/bidding.types';
import { useMyStanding } from './useMyStanding';
import { usePlaceBid } from './usePlaceBid';

/**
 * One bid in the making: the amount, the server's floor under it, and placing it. Shared by the
 * desktop bid panel and the bid sheet so both follow the same rules:
 * - bids move in the auction's step at its price level (the server's ladder), and the amount can
 *   never fall below the server's minimum;
 * - when another bidder raises the floor above the chosen amount, the next confirmation only
 *   adopts the new amount, so a bid is never sent for more than the user had in front of them;
 * - one Idempotency-Key per bid intent (auction + amount): retrying the same bid after a timeout
 *   reuses it, so a bid the server already committed is never placed twice.
 */
export function useBidDraft(auction: AuctionPricing) {
  const placeBid = usePlaceBid(auction.id);
  const standing = useMyStanding(auction.id);
  const minimumBid = computeMinimumBid(auction) ?? 0;
  // The raise at this price level (the server's ladder), else the auction's fixed increment.
  const increment = parseMoney(auction.bidIncrement ?? auction.minIncrement) ?? 1;
  const [chosenAmount, setChosenAmount] = useState(minimumBid);

  // Clamped during render rather than synced in an effect: the shown amount is never briefly
  // below what the server would accept, and a deliberately higher bid is preserved.
  const amount = Math.max(chosenAmount, minimumBid);
  // A rise the user caused (their own bid, or their auto-bid answering someone) is not a conflict.
  const priceMoved = chosenAmount < minimumBid && !standing?.leading;
  const buyNowPrice = parseMoney(auction.buyNowPrice);
  const reachesBuyNow = buyNowPrice != null && amount >= buyNowPrice;

  const intent = useRef<{ amount: number; key: string } | null>(null);

  /** Places the current amount; resolves false when nothing was placed (the caller resets). */
  async function place(): Promise<boolean> {
    if (priceMoved) {
      setChosenAmount(minimumBid);
      return false;
    }
    if (intent.current?.amount !== amount) {
      intent.current = { amount, key: newIdempotencyKey() };
    }
    try {
      const response = await placeBid.mutateAsync({ amount, idempotencyKey: intent.current.key });
      intent.current = null;
      // The next decision starts from the minimum after this bid, not the amount just placed.
      const next = response?.auction
        ? computeMinimumBid({
            currentPrice: response.auction.currentPrice,
            startingPrice: auction.startingPrice,
            minIncrement: auction.minIncrement,
            minNextBid: response.auction.minNextBid,
          })
        : null;
      if (next != null) setChosenAmount(next);
      return true;
    } catch {
      return false;
    }
  }

  return {
    amount,
    minimumBid,
    increment,
    priceMoved,
    reachesBuyNow,
    /** Any amount: snapped to exact 2-decimal money (the stepper adds in floating point). */
    setAmount: (next: number) => setChosenAmount(roundMoney(next)),
    adoptMinimum: () => setChosenAmount(minimumBid),
    place,
    isPending: placeBid.isPending,
    error: placeBid.error,
    resetError: placeBid.reset,
  };
}

export type BidDraft = ReturnType<typeof useBidDraft>;
