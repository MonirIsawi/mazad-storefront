import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useToastStore } from '@shared/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { BidPanel } from './BidPanel';
import { biddingApi } from '../api/bidding.api';
import biddingEn from '../i18n/en.json';
import biddingAr from '../i18n/ar.json';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('../api/bidding.api', () => ({
  biddingApi: {
    getAuctionPricing: vi.fn(),
    placeBid: vi.fn(),
    buyNow: vi.fn(),
    listMyBids: vi.fn(),
    getMyStanding: vi.fn(),
    cancelAutoBid: vi.fn(),
  },
}));

function renderPanel(isOwnAuction: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <BidPanel auctionId="auction-1" isOwnAuction={isOwnAuction} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

beforeAll(async () => {
  addNamespaceBundle('bidding', 'en', biddingEn);
  addNamespaceBundle('bidding', 'ar', biddingAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
  vi.mocked(biddingApi.getAuctionPricing).mockResolvedValue({
    id: 'auction-1',
    status: 'LIVE',
    startingPrice: '100000.00',
    minIncrement: '5000.00',
    currentPrice: null,
    buyNowPrice: '500000.00',
    endsAt: '2030-01-01T00:00:00.000Z',
  });
});

afterEach(() => {
  setSessionTokens(null);
});

const standing = (overrides: Record<string, unknown> = {}) => ({
  auctionId: 'auction-1',
  status: 'LIVE',
  leading: false,
  myHighestBid: null,
  minNextBid: '100000.00',
  autoBid: null,
  ...overrides,
});

describe('BidPanel: the server says what happened', () => {
  it('uses the server minimum and shows the leader', async () => {
    vi.mocked(biddingApi.getAuctionPricing).mockResolvedValue({
      id: 'auction-1',
      status: 'LIVE',
      startingPrice: '50000.00',
      minIncrement: '1000.00',
      currentPrice: '99000.00',
      buyNowPrice: null,
      endsAt: '2030-01-01T00:00:00.000Z',
      minNextBid: '100000.00',
      bidIncrement: '1000.00',
    });
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(
      standing({ leading: true, myHighestBid: '99000.00' }),
    );
    renderPanel(false);
    expect(await screen.findByTestId('bid-leading')).toBeTruthy();
    expect(screen.getAllByText(/100,000/).length).toBeGreaterThan(0);
  });

  it('says plainly when an automatic bid countered the bid at once', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    vi.mocked(biddingApi.placeBid).mockResolvedValue({
      id: 'b1',
      auctionId: 'auction-1',
      amount: '100000.00',
      createdAt: '2026-10-10T10:00:00.000Z',
      leading: false,
      outbidByAutoBid: true,
      auction: {
        currentPrice: '105000.00',
        bidCount: 2,
        endsAt: '2030-01-01T00:00:00.000Z',
        status: 'LIVE',
        minNextBid: '110000.00',
      },
    });
    renderPanel(false);
    await userEvent.click(await screen.findByRole('button', { name: /Place bid/ }));
    expect(useToastStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          variant: 'error',
          message: "Another bidder's automatic bid is higher — you were outbid.",
        }),
      ]),
    );
  });

  it('after your own bid, starts from the new minimum without a "price moved" warning', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing({ leading: true }));
    vi.mocked(biddingApi.placeBid).mockResolvedValue({
      id: 'b1',
      auctionId: 'auction-1',
      amount: '100000.00',
      createdAt: '2026-10-10T10:00:00.000Z',
      leading: true,
      auction: {
        currentPrice: '100000.00',
        bidCount: 1,
        endsAt: '2030-01-01T00:00:00.000Z',
        status: 'LIVE',
        minNextBid: '105000.00',
      },
    });
    renderPanel(false);
    await userEvent.click(await screen.findByRole('button', { name: /Place bid/ }));
    expect((await screen.findAllByText(/105,000/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/minimum bid rose/i)).toBeNull();
  });

  it('shows an auto-bid set earlier, and its exhaustion', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(
      standing({ autoBid: { maxAmount: '120000.00', exhausted: true } }),
    );
    renderPanel(false);
    expect(await screen.findByTestId('auto-bid-active')).toHaveTextContent(
      'The price passed your auto-bid limit of 120,000',
    );
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
  });
});

describe('BidPanel: who can bid', () => {
  it('offers a signed-in buyer the bid form', async () => {
    renderPanel(false);
    expect(await screen.findByRole('button', { name: /Place bid/ })).toBeTruthy();
  });

  it('offers the seller no bid on their own live auction, and says why', async () => {
    renderPanel(true);
    expect(await screen.findByText('This is your auction. Buyers bid on it here.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Place bid/ })).toBeNull();
    expect(screen.queryByText(/Buy now/)).toBeNull();
  });
});

describe('BidPanel: the winner of a closed auction', () => {
  const sold = async () =>
    vi.mocked(biddingApi.getAuctionPricing).mockResolvedValue({
      id: 'auction-1',
      status: 'SOLD',
      startingPrice: '100000.00',
      minIncrement: '5000.00',
      currentPrice: '150000.00',
      buyNowPrice: null,
      endsAt: '2026-01-01T00:00:00.000Z',
    });

  function renderWinner(winner: { orderId: string | null } | null) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <BidPanel auctionId="auction-1" winner={winner} />
        </I18nextProvider>
      </QueryClientProvider>,
    );
  }

  it('takes the winner to the order the win became', async () => {
    await sold();
    renderWinner({ orderId: 'o1' });
    const link = await screen.findByRole('link', { name: 'You won · View order' });
    expect(link.getAttribute('href')).toBe('/account/orders/o1');
    expect(screen.queryByText(/Bidding is closed/)).toBeNull();
  });

  it('points to the wins list while the order is still being created', async () => {
    await sold();
    renderWinner({ orderId: null });
    const link = await screen.findByRole('link', { name: 'You won · See your wins' });
    expect(link.getAttribute('href')).toBe('/account/wins');
  });

  it('tells everyone else that bidding is closed', async () => {
    await sold();
    renderWinner(null);
    expect(await screen.findByText(/Bidding is closed/)).toBeTruthy();
    expect(screen.queryByTestId('won-view-order')).toBeNull();
  });
});
