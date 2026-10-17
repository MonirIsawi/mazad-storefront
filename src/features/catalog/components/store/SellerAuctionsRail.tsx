'use client';

import { AuctionCard, Rail } from '@shared/components/cards';
import { useSellerLiveAuctions } from '../../hooks/useSellerLiveAuctions';

/** The seller page's "Current auctions": their live lots across all of their stores. */
export function SellerAuctionsRail({ sellerId, title }: { sellerId: string; title: string }) {
  const auctions = useSellerLiveAuctions(sellerId);
  const items = auctions.data?.data ?? [];
  if (items.length === 0) return null;
  return (
    <Rail title={title}>
      {items.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </Rail>
  );
}
