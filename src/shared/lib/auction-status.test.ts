import { describe, expect, it } from 'vitest';
import { getAuctionStatusLabelKey, getAuctionStatusTone } from './auction-status';
import type { AuctionStatus } from '@shared/types';

const HOUR = 60 * 60 * 1000;

describe('auction status badge', () => {
  it('shows a live auction as live, then ending soon in its last hour', () => {
    expect(getAuctionStatusLabelKey('LIVE', 3 * HOUR)).toBe('auctionStatus.live');
    expect(getAuctionStatusLabelKey('LIVE', 10 * 60 * 1000)).toBe('auctionStatus.endingSoon');
  });

  // Device QA: the web badge read "Live" for ~2 s between the countdown reaching zero and the
  // server's close event.
  it('never falls back to "live" once the deadline has passed but the server has not closed yet', () => {
    expect(getAuctionStatusLabelKey('LIVE', 0)).toBe('auctionStatus.endingSoon');
    expect(getAuctionStatusLabelKey('LIVE', -1500)).toBe('auctionStatus.endingSoon');
    expect(getAuctionStatusTone('LIVE', -1500)).toBe('warning');
  });

  it('shows an upcoming auction as upcoming whatever its countdown', () => {
    expect(getAuctionStatusLabelKey('SCHEDULED', 2 * HOUR)).toBe('auctionStatus.upcoming');
    expect(getAuctionStatusTone('SCHEDULED', 0)).toBe('upcoming');
  });

  it.each<[AuctionStatus, string]>([
    ['ENDED', 'auctionStatus.ended'],
    ['SOLD', 'auctionStatus.sold'],
    ['UNSOLD', 'auctionStatus.ended'],
    ['CANCELLED', 'auctionStatus.cancelled'],
    ['PENDING_APPROVAL', 'auctionStatus.ended'],
    ['DRAFT', 'auctionStatus.ended'],
    ['REJECTED', 'auctionStatus.ended'],
  ])('never shows %s as live or ending soon (label %s)', (status, label) => {
    for (const endsInMs of [-HOUR, 0, 10 * 60 * 1000, 5 * HOUR]) {
      expect(['live', 'warning']).not.toContain(getAuctionStatusTone(status, endsInMs));
      expect(getAuctionStatusLabelKey(status, endsInMs)).toBe(label);
    }
  });
});
