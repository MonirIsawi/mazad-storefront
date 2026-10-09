'use client';

import { useParams } from 'next/navigation';
import { useCurrentUser } from '@features/auth';
import { AuctionDetailPage } from '@features/catalog';
import { BidPanel } from '@features/bidding';
import { WatchlistToggle } from '@features/watchlist';
import { FollowSellerButton } from '@features/sellers';

export function AuctionPageClient() {
  const params = useParams<{ id: string }>();
  const me = useCurrentUser();
  return (
    <AuctionDetailPage
      id={params.id}
      renderBiddingPanel={(sellerId) => (
        <BidPanel auctionId={params.id} isOwnAuction={!!me.data && me.data.id === sellerId} />
      )}
      watchlistToggle={<WatchlistToggle auctionId={params.id} />}
      renderSellerFollowToggle={(sellerId) => <FollowSellerButton sellerId={sellerId} />}
    />
  );
}
