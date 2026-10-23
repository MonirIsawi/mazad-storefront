'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAddresses } from '@features/addresses';
import { useCurrentUser } from '@features/auth';
import { AuctionDetailPage } from '@features/catalog';
import { BidPanel, useMyStanding } from '@features/bidding';
import { RemindMeButton, WatchlistToggle } from '@features/watchlist';
import { useWins } from '@features/wins';
import { useIsAuthenticated } from '@shared/hooks';
import { SellerFollowToggle } from '@app/sellers/SellerFollowToggle';
import { DeliveryLine } from './DeliveryLine';

/** Statuses after which nobody bids any more and the viewer may be the winner. */
const CLOSED = new Set(['ENDED', 'SOLD', 'UNSOLD']);
/** While a won auction's order is still being created, look again this often. */
const ORDER_POLL_MS = 3_000;

/**
 * The bid panel for one auction, composed here because it needs four features: the signed-in user
 * (own auction, bidding paused), the user's wins ("You won · View order" on a closed auction they
 * won), and their addresses (bidding needs one: "add an address first").
 */
export function AuctionBidding({
  auctionId,
  sellerId,
  status,
  isSheetOpenOnLoad = false,
}: {
  auctionId: string;
  sellerId: string;
  status: string;
  isSheetOpenOnLoad?: boolean;
}) {
  const me = useCurrentUser();
  const isAuthenticated = useIsAuthenticated();
  const isClosed = CLOSED.has(status);
  const wins = useWins(isClosed);
  // A win is an order at once (CONFIRMED); PASSED_OVER went to the next bidder.
  const win = wins.data?.find((w) => w.auctionId === auctionId && w.status === 'CONFIRMED');
  const orderId = win?.orderItem?.orderId ?? null;
  const refetchWins = wins.refetch;

  // Closed while the page was open (realtime): the win may be new, and a cached list would miss
  // it. Only then, and only signed in: refetch() ignores `enabled`, so a signed-out visitor would
  // get a 401. A page opened already closed fetches through the query itself.
  const wasClosed = useRef(isClosed);
  useEffect(() => {
    if (isClosed && !wasClosed.current && isAuthenticated) void refetchWins();
    wasClosed.current = isClosed;
  }, [isClosed, isAuthenticated, refetchWins]);
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

  const isOwnAuction = !!me.data && me.data.id === sellerId;
  const addresses = useAddresses(isAuthenticated && !isClosed && !isOwnAuction);
  return (
    <BidPanel
      auctionId={auctionId}
      isOwnAuction={isOwnAuction}
      winner={win ? { orderId } : null}
      // A closed auction's wins still loading: the winner must not first read "sold to another".
      isCheckingWin={isClosed && isAuthenticated && !isOwnAuction && wins.isPending}
      reminder={<RemindMeButton auctionId={auctionId} />}
      deliveryLine={<DeliveryLine />}
      isSheetOpenOnLoad={isSheetOpenOnLoad}
      hasAddress={addresses.data ? addresses.data.length > 0 : undefined}
      isBiddingPaused={me.data?.biddingPaused === true}
    />
  );
}

export function AuctionPageClient() {
  const params = useParams<{ id: string }>();
  // "Bid" on My bids lands here with ?bid=1: the bid sheet opens at once (when bidding is open).
  const isSheetOpenOnLoad = useSearchParams().get('bid') === '1';
  const standing = useMyStanding(params.id);
  // Outbid: the viewer bid, doesn't lead, and no auto-bid of theirs is still answering.
  const isOutbid =
    !!standing?.myHighestBid &&
    !standing.leading &&
    !(standing.autoBid && !standing.autoBid.exhausted);
  return (
    <AuctionDetailPage
      id={params.id}
      isOutbid={isOutbid}
      renderBiddingPanel={({ sellerId, status }) => (
        <AuctionBidding
          auctionId={params.id}
          sellerId={sellerId}
          status={status}
          isSheetOpenOnLoad={isSheetOpenOnLoad}
        />
      )}
      watchlistToggle={<WatchlistToggle auctionId={params.id} />}
      renderSellerFollowToggle={(sellerId) => (
        <SellerFollowToggle sellerId={sellerId} emphasis="quiet" />
      )}
    />
  );
}
