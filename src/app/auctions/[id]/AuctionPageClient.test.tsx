import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AuctionBidding } from './AuctionPageClient';

const bidPanel = vi.fn((_props: unknown) => null);
const wins = { data: undefined as unknown, refetch: vi.fn() };
const useWins = vi.fn((_enabled?: boolean) => wins);
vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'a1' }) }));
vi.mock('@features/bidding', () => ({ BidPanel: (props: unknown) => bidPanel(props) }));
vi.mock('@features/auth', () => ({ useCurrentUser: () => ({ data: { id: 'buyer-1' } }) }));
vi.mock('@features/wins', () => ({ useWins: (enabled?: boolean) => useWins(enabled) }));
vi.mock('@features/catalog', () => ({ AuctionDetailPage: () => null }));
vi.mock('@features/watchlist', () => ({ WatchlistToggle: () => null }));
vi.mock('@features/sellers', () => ({ FollowSellerButton: () => null }));

const win = (auctionId: string, orderId: string | null, status = 'CONFIRMED') => ({
  auctionId,
  status,
  orderItem: orderId ? { orderId } : null,
});
const lastProps = () =>
  bidPanel.mock.calls.at(-1)?.[0] as { winner: unknown; isOwnAuction: boolean };

beforeEach(() => {
  bidPanel.mockClear();
  useWins.mockClear();
  wins.refetch.mockClear();
});

describe('AuctionBidding (route composition)', () => {
  it("gives the panel the viewer's win on this closed auction, with its order", () => {
    wins.data = [win('other', 'o9'), win('a1', 'o1')];
    render(<AuctionBidding auctionId="a1" sellerId="seller-1" status="SOLD" />);
    expect(lastProps().winner).toEqual({ orderId: 'o1' });
    expect(lastProps().isOwnAuction).toBe(false);
  });

  it('no winner state for someone who did not win it (or whose win was declined)', () => {
    wins.data = [win('other', 'o9'), win('a1', 'o1', 'DECLINED')];
    render(<AuctionBidding auctionId="a1" sellerId="seller-1" status="SOLD" />);
    expect(lastProps().winner).toBeNull();
  });

  it('only looks the wins up once the auction is closed, and refetches then', () => {
    wins.data = undefined;
    render(<AuctionBidding auctionId="a1" sellerId="seller-1" status="LIVE" />);
    expect(useWins).toHaveBeenLastCalledWith(false);
    expect(wins.refetch).not.toHaveBeenCalled();
    render(<AuctionBidding auctionId="a1" sellerId="seller-1" status="SOLD" />);
    expect(useWins).toHaveBeenLastCalledWith(true);
    expect(wins.refetch).toHaveBeenCalled();
  });

  it('the seller of the auction is never the winner and gets the own-auction state', () => {
    wins.data = [];
    render(<AuctionBidding auctionId="a1" sellerId="buyer-1" status="LIVE" />);
    expect(lastProps().isOwnAuction).toBe(true);
    expect(lastProps().winner).toBeNull();
  });
});
