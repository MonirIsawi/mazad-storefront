import type { AuctionStatus } from '@shared/types';

export type AuctionStatusTone = 'live' | 'upcoming' | 'warning' | 'neutral';

const ENDING_SOON_MS = 60 * 60 * 1000;

export function getAuctionStatusTone(status: AuctionStatus, endsInMs: number): AuctionStatusTone {
  if (status === 'LIVE') {
    // Past the deadline the server still says LIVE until its close job runs (a second or two) or
    // an anti-sniping bid moves endsAt: keep "ending soon" until then, never fall back to "live".
    return endsInMs <= ENDING_SOON_MS ? 'warning' : 'live';
  }
  if (status === 'SCHEDULED') return 'upcoming';
  return 'neutral';
}

/** Key into the `common` namespace's `auctionStatus.*` strings. */
export function getAuctionStatusLabelKey(status: AuctionStatus, endsInMs: number): string {
  const tone = getAuctionStatusTone(status, endsInMs);
  if (tone === 'warning') return 'auctionStatus.endingSoon';
  if (tone === 'live') return 'auctionStatus.live';
  if (tone === 'upcoming') return 'auctionStatus.upcoming';
  // Finished auctions say how they finished where it matters to a buyer: sold or cancelled.
  if (status === 'SOLD') return 'auctionStatus.sold';
  if (status === 'CANCELLED') return 'auctionStatus.cancelled';
  return 'auctionStatus.ended';
}
