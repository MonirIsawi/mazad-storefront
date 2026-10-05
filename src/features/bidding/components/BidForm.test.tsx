import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { BidForm } from './BidForm';
import { BuyNowButton } from './BuyNowButton';
import { biddingApi } from '../api/bidding.api';
import biddingEn from '../i18n/en.json';
import biddingAr from '../i18n/ar.json';
import type { AuctionPricing } from '../types/bidding.types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('../api/bidding.api', () => ({ biddingApi: { placeBid: vi.fn(), buyNow: vi.fn() } }));

beforeAll(async () => {
  addNamespaceBundle('bidding', 'en', biddingEn);
  addNamespaceBundle('bidding', 'ar', biddingAr);
  // Money formatting follows the locale store (default "ar"), labels follow i18n.
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(biddingApi.placeBid)
    .mockReset()
    .mockResolvedValue({} as never);
});

const auction = (overrides: Partial<AuctionPricing> = {}): AuctionPricing => ({
  id: 'auction-1',
  status: 'LIVE',
  startingPrice: '100000.00',
  minIncrement: '5000.00',
  currentPrice: null,
  buyNowPrice: null,
  endsAt: '2030-01-01T00:00:00.000Z',
  ...overrides,
});

describe('BidForm minimum bid', () => {
  it('lets the first bidder bid the starting price, as the API allows', async () => {
    renderWithQuery(<BidForm auction={auction()} />);

    expect(screen.getByText(/minimum bid 100,000 IQD/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));

    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 100_000, expect.any(String));
  });

  it('submits exactly the minimum it displays once there are bids', async () => {
    renderWithQuery(<BidForm auction={auction({ currentPrice: '125000.00' })} />);

    expect(screen.getByText(/minimum bid 130,000 IQD/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));

    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 130_000, expect.any(String));
  });

  it('steps in exact increments, without floating-point drift', async () => {
    renderWithQuery(
      <BidForm
        auction={auction({
          currentPrice: '1000.10',
          startingPrice: '1000.00',
          minIncrement: '0.10',
        })}
      />,
    );

    const increase = screen.getByRole('button', { name: /increase amount/i });
    await userEvent.click(increase);
    await userEvent.click(increase);
    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));

    // 1000.10 + 0.10 = 1000.20 minimum, two steps up = 1000.40 exactly (not 1000.4000000000001).
    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 1000.4, expect.any(String));
  });
});

/** Renders with providers that survive rerender(), so a test can move the price under the form. */
function renderLive(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrap = (node: ReactElement) => (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{node}</I18nextProvider>
    </QueryClientProvider>
  );
  const result = render(wrap(ui));
  return { rerender: (next: ReactElement) => result.rerender(wrap(next)) };
}

describe('BidForm submits only what the user saw', () => {
  it('when the minimum rises, the first tap adopts the new amount and the second places it', async () => {
    const view = renderLive(<BidForm auction={auction({ currentPrice: '100000.00' })} />);
    // Someone bids 500,000 while the user is looking at 105,000.
    view.rerender(<BidForm auction={auction({ currentPrice: '500000.00' })} />);

    expect(screen.getByRole('status')).toHaveTextContent(/rose to 505,000 IQD/i);
    await userEvent.click(screen.getByRole('button', { name: /bid 505,000 IQD/i }));
    expect(biddingApi.placeBid).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));
    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 505_000, expect.any(String));
  });

  it('retries the same bid with the same Idempotency-Key, and a new bid gets a new one', async () => {
    vi.mocked(biddingApi.placeBid).mockRejectedValueOnce(new Error('timeout'));
    renderWithQuery(<BidForm auction={auction({ currentPrice: '125000.00' })} />);

    const place = screen.getByRole('button', { name: /place bid/i });
    await userEvent.click(place);
    await userEvent.click(place);
    const [first, retry] = vi.mocked(biddingApi.placeBid).mock.calls;
    expect(retry![2]).toBe(first![2]);

    await userEvent.click(screen.getByRole('button', { name: /increase amount/i }));
    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));
    expect(vi.mocked(biddingApi.placeBid).mock.calls[2]![2]).not.toBe(first![2]);
  });

  it('warns when the amount reaches the buy-now price', () => {
    renderWithQuery(
      <BidForm auction={auction({ currentPrice: '195000.00', buyNowPrice: '200000.00' })} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/buys the item now/i);
  });
});

describe('BuyNowButton', () => {
  beforeEach(() => {
    vi.mocked(biddingApi.buyNow)
      .mockReset()
      .mockResolvedValue({} as never);
  });

  it('never buys on a single tap', async () => {
    renderWithQuery(<BuyNowButton auctionId="auction-1" buyNowPrice="200000.00" />);

    await userEvent.click(screen.getByRole('button', { name: /buy now for 200,000 IQD/i }));
    expect(biddingApi.buyNow).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/ends the auction/i);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(biddingApi.buyNow).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /buy now for 200,000 IQD/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /confirm purchase for 200,000 IQD/i }),
    );
    expect(biddingApi.buyNow).toHaveBeenCalledExactlyOnceWith('auction-1', expect.any(String));
  });
});
