import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

/** Money never moves on a tap: the slide's tap path opens a confirmation, which places the bid. */
async function placeBidBySlide() {
  await userEvent.click(await screen.findByRole('button', { name: /^Slide to bid/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Place bid' }));
}

function renderPanel(
  isOwnAuction: boolean,
  extra: { hasAddress?: boolean; isBiddingPaused?: boolean } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <BidPanel auctionId="auction-1" isOwnAuction={isOwnAuction} {...extra} />
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

describe('BidPanel: an address first, and paused bidding', () => {
  it('signed in with no saved address: "Bid" asks for an address instead of opening the sheet', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    renderPanel(false, { hasAddress: false });
    await userEvent.click(await screen.findByRole('button', { name: 'Bid' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add an address first' });
    expect(dialog).toHaveTextContent('You need at least one saved address before you can bid.');
    expect(screen.queryByRole('button', { name: /^Slide to bid/ })).toBeNull();
    expect(screen.getAllByTestId('bid-address-first-add')[0]?.getAttribute('href')).toBe(
      '/account/addresses',
    );
  });

  it('paused after two violations: says so, offers support, and no bid actions', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    renderPanel(false, { isBiddingPaused: true, hasAddress: true });
    expect(await screen.findByTestId('auction-user-state')).toHaveTextContent(
      'Your bidding is paused after two refused deliveries.',
    );
    expect(screen.getByTestId('bidding-paused-support').getAttribute('href')).toBe('/contact');
    expect(screen.queryByRole('button', { name: 'Bid' })).toBeNull();
  });

  it('a BIDDING_PAUSED refusal explains the pause and links to support', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    vi.mocked(biddingApi.placeBid).mockRejectedValue(
      Object.assign(new Error('paused'), {
        isAxiosError: true,
        response: {
          status: 403,
          data: { errorCode: 'BIDDING_PAUSED', details: { violations: 2, limit: 2 } },
        },
      }),
    );
    renderPanel(false, { hasAddress: true });
    await placeBidBySlide();
    expect(
      await screen.findByText(/Your bidding is paused after two refused deliveries\. Contact/),
    ).toBeTruthy();
  });
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
    expect(await screen.findByTestId('auction-user-state')).toHaveTextContent(
      'You are leading. We will alert you if someone outbids you.',
    );
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
    await placeBidBySlide();
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
    await placeBidBySlide();
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
    expect(await screen.findByRole('button', { name: /^Slide to bid/ })).toBeTruthy();
  });

  it('offers the seller no bid on their own live auction, and says why', async () => {
    renderPanel(true);
    expect(await screen.findByTestId('auction-user-state')).toHaveTextContent(
      'This is your auction',
    );
    expect(screen.queryByRole('button', { name: /Slide to bid/ })).toBeNull();
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
    const link = await screen.findByRole('link', { name: 'View your order' });
    expect(link.getAttribute('href')).toBe('/account/orders/o1');
    expect(screen.queryByText(/Bidding is closed/)).toBeNull();
  });

  it('points to the wins list while the order is still being created', async () => {
    await sold();
    renderWinner({ orderId: null });
    const link = await screen.findByRole('link', { name: 'See your wins' });
    expect(link.getAttribute('href')).toBe('/account/wins');
  });

  it('says "You won this auction" once, with the way to the order', async () => {
    await sold();
    renderWinner({ orderId: 'o1' });
    expect(await screen.findByTestId('auction-user-state')).toHaveTextContent(
      'You won! Your order is created at your default address.',
    );
    expect(screen.getAllByTestId('auction-user-state')).toHaveLength(1);
  });

  it('tells everyone else it was sold to another bidder', async () => {
    await sold();
    renderWinner(null);
    expect(await screen.findByTestId('auction-user-state')).toHaveTextContent(
      'Sold to another bidder',
    );
    expect(screen.queryByTestId('won-view-order')).toBeNull();
    expect(screen.queryByRole('button', { name: /Slide to bid/ })).toBeNull();
  });
});

describe('BidPanel: the one state line', () => {
  const pricing = (status: string) =>
    vi.mocked(biddingApi.getAuctionPricing).mockResolvedValue({
      id: 'auction-1',
      status,
      startingPrice: '100000.00',
      minIncrement: '5000.00',
      currentPrice: status === 'SCHEDULED' ? null : '150000.00',
      buyNowPrice: null,
      endsAt: '2030-01-01T00:00:00.000Z',
    });

  const stateLine = async () => {
    const lines = await screen.findAllByTestId('auction-user-state');
    expect(lines).toHaveLength(1);
    return lines[0];
  };

  it.each([
    ['ENDED', 'This auction has ended'],
    ['UNSOLD', 'This auction has ended'],
    ['CANCELLED', 'This auction has ended'],
    ['SCHEDULED', "The auction hasn't started yet."],
  ])('%s: "%s", and nothing to bid', async (status, text) => {
    pricing(status);
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    renderPanel(false);
    expect(await stateLine()).toHaveTextContent(text);
    expect(screen.queryByRole('button', { name: /Slide to bid/ })).toBeNull();
  });

  it('the seller sees their own auction even once it sold', async () => {
    pricing('SOLD');
    renderPanel(true);
    expect(await stateLine()).toHaveTextContent('This is your auction');
  });

  it('an active auto-bid, with its limit, ahead of leading', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(
      standing({ leading: true, autoBid: { maxAmount: '200000.00', exhausted: false } }),
    );
    renderPanel(false);
    await waitFor(async () =>
      expect(await stateLine()).toHaveTextContent('Auto-bid on up to 200,000 IQD'),
    );
    expect(screen.queryByText(/You are leading/)).toBeNull();
  });

  it('outbid, with no "leading" anywhere else on the panel', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing({ myHighestBid: '120000.00' }));
    renderPanel(false);
    await waitFor(async () =>
      expect(await stateLine()).toHaveTextContent(
        'You were outbid. The lowest bid to lead again: 100,000 IQD',
      ),
    );
    expect(screen.queryByText(/leading/)).toBeNull();
  });

  it('a signed-in buyer with no bids can bid', async () => {
    vi.mocked(biddingApi.getMyStanding).mockResolvedValue(standing());
    renderPanel(false);
    expect(await stateLine()).toHaveTextContent('You can bid');
    expect(await screen.findByRole('button', { name: /^Slide to bid/ })).toBeTruthy();
  });

  it('a guest gets the sign-in button as the only state', async () => {
    setSessionTokens(null);
    renderPanel(false);
    expect(await screen.findByRole('link', { name: 'Sign in to place a bid' })).toBeTruthy();
    expect(screen.queryByTestId('auction-user-state')).toBeNull();
  });

  it('waits for the wins before saying anything about a closed auction', async () => {
    pricing('SOLD');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <I18nextProvider i18n={i18n}>
          <BidPanel auctionId="auction-1" isCheckingWin />
        </I18nextProvider>
      </QueryClientProvider>,
    );
    // Pricing has arrived; the state still waits for the wins.
    await waitFor(() =>
      expect(client.getQueryData(['bidding', 'auctionPricing', 'auction-1'])).toBeTruthy(),
    );
    expect(screen.queryByTestId('auction-user-state')).toBeNull();
  });

  it('in Arabic', async () => {
    useLocaleStore.getState().setLocale('ar');
    await i18n.changeLanguage('ar');
    try {
      vi.mocked(biddingApi.getMyStanding).mockResolvedValue(
        standing({ leading: true, myHighestBid: '150000.00' }),
      );
      renderPanel(false);
      await waitFor(async () => expect(await stateLine()).toHaveTextContent('أنت المتصدر حالياً'));
    } finally {
      useLocaleStore.getState().setLocale('en');
      await i18n.changeLanguage('en');
    }
  });
});
