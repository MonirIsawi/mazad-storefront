import { describe, expect, it } from 'vitest';
import { userStateOf, type UserStateInput } from './user-state';

const standing = (extra: Partial<NonNullable<UserStateInput['standing']>> = {}) => ({
  auctionId: 'a1',
  status: 'LIVE',
  leading: false,
  myHighestBid: null,
  minNextBid: '100000.00',
  autoBid: null,
  ...extra,
});

const input = (extra: Partial<UserStateInput> = {}): UserStateInput => ({
  status: 'LIVE',
  isOwnAuction: false,
  isWinner: false,
  isAuthenticated: true,
  standing: standing(),
  ...extra,
});

const kind = (extra: Partial<UserStateInput>) => userStateOf(input(extra)).kind;

describe('userStateOf: one state, in priority order', () => {
  it('the seller always sees their own auction, whatever its status', () => {
    for (const status of ['LIVE', 'SCHEDULED', 'SOLD', 'ENDED']) {
      expect(kind({ status, isOwnAuction: true, standing: standing({ leading: true }) })).toBe(
        'own',
      );
    }
  });

  it('the winner, before "sold to another"', () => {
    expect(kind({ status: 'SOLD', isWinner: true })).toBe('won');
    expect(kind({ status: 'SOLD' })).toBe('soldToOther');
    expect(kind({ status: 'SOLD', isAuthenticated: false, standing: null })).toBe('soldToOther');
  });

  it.each(['ENDED', 'UNSOLD', 'CANCELLED'])('%s: the auction has ended', (status) => {
    expect(kind({ status, standing: standing({ leading: true }) })).toBe('ended');
  });

  it('not started, even for a guest', () => {
    expect(kind({ status: 'SCHEDULED' })).toBe('notStarted');
    expect(kind({ status: 'SCHEDULED', isAuthenticated: false, standing: null })).toBe(
      'notStarted',
    );
  });

  it('a guest on a live auction is asked to sign in', () => {
    expect(kind({ isAuthenticated: false, standing: null })).toBe('signIn');
  });

  it('an active auto-bid comes before leading; an exhausted one does not count', () => {
    expect(
      userStateOf(
        input({
          standing: standing({
            leading: true,
            autoBid: { maxAmount: '200000.00', exhausted: false },
          }),
        }),
      ),
    ).toEqual({ kind: 'autoBid', maxAmount: '200000.00' });
    expect(
      kind({
        standing: standing({
          myHighestBid: '150000.00',
          autoBid: { maxAmount: '150000.00', exhausted: true },
        }),
      }),
    ).toBe('outbid');
  });

  it('paused bidding (two violations) comes before the standing, after sign-in', () => {
    expect(kind({ isBiddingPaused: true, standing: standing({ leading: true }) })).toBe('paused');
    expect(kind({ isBiddingPaused: true, isAuthenticated: false })).toBe('signIn');
    expect(kind({ isBiddingPaused: true, status: 'ENDED' })).toBe('ended');
  });

  it('leading, outbid, or free to bid', () => {
    expect(kind({ standing: standing({ leading: true, myHighestBid: '150000.00' }) })).toBe(
      'leading',
    );
    expect(kind({ standing: standing({ myHighestBid: '150000.00' }) })).toBe('outbid');
    expect(kind({ standing: standing() })).toBe('canBid');
    expect(kind({ standing: null })).toBe('canBid');
  });
});
