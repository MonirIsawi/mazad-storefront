import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
