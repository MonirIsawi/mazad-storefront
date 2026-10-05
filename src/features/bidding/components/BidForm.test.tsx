import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { BidForm } from './BidForm';
import { biddingApi } from '../api/bidding.api';
import biddingEn from '../i18n/en.json';
import biddingAr from '../i18n/ar.json';
import type { AuctionPricing } from '../types/bidding.types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('../api/bidding.api', () => ({ biddingApi: { placeBid: vi.fn() } }));

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

    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 100_000);
  });

  it('submits exactly the minimum it displays once there are bids', async () => {
    renderWithQuery(<BidForm auction={auction({ currentPrice: '125000.00' })} />);

    expect(screen.getByText(/minimum bid 130,000 IQD/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /place bid/i }));

    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 130_000);
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
    expect(biddingApi.placeBid).toHaveBeenCalledWith('auction-1', 1000.4);
  });
});
