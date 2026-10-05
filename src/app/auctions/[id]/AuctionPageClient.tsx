'use client';

import { useParams } from 'next/navigation';
import { AuctionDetailPage } from '@features/catalog';
import { BidPanel } from '@features/bidding';
import { WatchlistToggle } from '@features/watchlist';
import { FollowSellerButton } from '@features/sellers';

export function AuctionPageClient() {
  const params = useParams<{ id: string }>();
  return (
    <AuctionDetailPage
      id={params.id}
      biddingPanel={<BidPanel auctionId={params.id} />}
      watchlistToggle={<WatchlistToggle auctionId={params.id} />}
      renderSellerFollowToggle={(sellerId) => <FollowSellerButton sellerId={sellerId} />}
    />
  );
}
