'use client';

import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { auctionChannel, type AuctionChannel } from './auction-channel';

/** Poll interval for a live auction while realtime events are flowing: reconciliation only. */
export const LIVE_RECONCILE_INTERVAL_MS = 30_000;
/** Poll interval without realtime (socket down, refused or unsupported): the previous behaviour. */
export const LIVE_POLL_INTERVAL_MS = 5_000;
/** A burst of bids becomes one refetch per window instead of one per event. */
export const EVENT_REFETCH_THROTTLE_MS = 500;

/**
 * Refetches `queryKey` whenever the auction changes server-side, and reports whether realtime is
 * currently active so the caller can relax its polling (`liveRefetchInterval`). Pass an empty
 * auctionId to stay idle.
 */
export function useAuctionLiveUpdates(
  auctionId: string,
  queryKey: QueryKey,
  channel: AuctionChannel = auctionChannel(),
): boolean {
  const queryClient = useQueryClient();
  const [live, setLive] = useState(false);
  // A stable string so an inline array literal does not resubscribe on every render.
  const keyHash = JSON.stringify(queryKey);

  useEffect(() => {
    if (!auctionId) return undefined;
    const key = JSON.parse(keyHash) as QueryKey;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refetch = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        void queryClient.invalidateQueries({ queryKey: key });
      }, EVENT_REFETCH_THROTTLE_MS);
    };
    const unsubscribe = channel.subscribe(auctionId, refetch, setLive);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      setLive(false);
    };
  }, [auctionId, keyHash, channel, queryClient]);

  return live;
}

/** refetchInterval for a LIVE auction: slow reconciliation with realtime, fast polling without. */
export function liveRefetchInterval(realtime: boolean): number {
  return realtime ? LIVE_RECONCILE_INTERVAL_MS : LIVE_POLL_INTERVAL_MS;
}
