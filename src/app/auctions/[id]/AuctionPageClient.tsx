'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@features/auth';
import { AuctionDetailPage } from '@features/catalog';
import { BidPanel } from '@features/bidding';
import { WatchlistToggle } from '@features/watchlist';
import { FollowSellerButton } from '@features/sellers';
import { useWins } from '@features/wins';

/** Statuses after which nobody bids any more and the viewer may be the winner. */
const CLOSED = new Set(['ENDED', 'SOLD', 'UNSOLD']);
/** While a won auction's order is still being created, look again this often. */
const ORDER_POLL_MS = 3_000;

/**
 * The bid panel for one auction, composed here because it needs three features: the signed-in user
 * (own auction), and the user's wins ("You won · View order" on a closed auction they won).
 */
export function AuctionBidding({
  auctionId,
  sellerId,
  status,
}: {
  auctionId: string;
  sellerId: string;
  status: string;
}) {
  const me = useCurrentUser();
  const isClosed = CLOSED.has(status);
  const wins = useWins(isClosed);
  const win = wins.data?.find(
    (w) =>
      w.auctionId === auctionId &&
      (w.status === 'CONFIRMED' || w.status === 'PENDING_CONFIRMATION'),
  );
  const orderId = win?.orderItem?.orderId ?? null;
  const refetchWins = wins.refetch;

  // Closed while the page was open (realtime): the win may be new.
  useEffect(() => {
    if (isClosed) void refetchWins();
  }, [isClosed, refetchWins]);
  // Won, but auto-fulfilment hasn't created the order yet: look again shortly, then stop.
  useEffect(() => {
    if (!win || orderId) return undefined;
    const timer = setInterval(() => void refetchWins(), ORDER_POLL_MS);
    const stop = setTimeout(() => clearInterval(timer), 10 * ORDER_POLL_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [win, orderId, refetchWins]);

  return (
    <BidPanel
      auctionId={auctionId}
      isOwnAuction={!!me.data && me.data.id === sellerId}
      winner={win ? { orderId } : null}
    />
  );
}

export function AuctionPageClient() {
  const params = useParams<{ id: string }>();
  return (
    <AuctionDetailPage
      id={params.id}
      renderBiddingPanel={({ sellerId, status }) => (
        <AuctionBidding auctionId={params.id} sellerId={sellerId} status={status} />
      )}
      watchlistToggle={<WatchlistToggle auctionId={params.id} />}
      renderSellerFollowToggle={(sellerId) => <FollowSellerButton sellerId={sellerId} />}
    />
  );
}
