import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { QUERY_KEYS } from '@shared/constants';
import { useLocaleStore } from '@shared/store';
import { sellingApi } from '../api/selling.api';
import sellingAr from '../i18n/ar.json';
import sellingEn from '../i18n/en.json';
import type { SellerAuction } from '../types/selling.types';
import { SellerAuctionCard } from './SellerAuctionCard';

vi.mock('../api/selling.api', () => ({
  sellingApi: { cancelAuction: vi.fn(), submitAuction: vi.fn() },
}));

const auction = (extra: Partial<SellerAuction> = {}): SellerAuction => ({
  id: 'a1',
  status: 'PENDING_APPROVAL',
  startingPrice: '10000',
  minIncrement: '1000',
  currentPrice: null,
  buyNowPrice: null,
  bidCount: 0,
  startsAt: '2026-10-20T10:00:00.000Z',
  endsAt: '2026-10-21T10:00:00.000Z',
  rejectionReason: null,
  cancelReason: null,
  product: { id: 'p1', nameEn: 'Camera', nameAr: 'كاميرا' },
  ...extra,
});

function conflict(errorCode: string) {
  const headers = new AxiosHeaders();
  return new AxiosError('Conflict', 'ERR_BAD_REQUEST', { headers }, null, {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers },
    data: { statusCode: 409, errorCode, message: 'x' },
  });
}

function renderCard(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  );
  return { invalidate };
}

beforeAll(async () => {
  addNamespaceBundle('selling', 'en', sellingEn);
  addNamespaceBundle('selling', 'ar', sellingAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(sellingApi.cancelAuction).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SellerAuctionCard: withdrawing a listing awaiting approval', () => {
  it('asks first, then withdraws it through the cancel route', async () => {
    vi.mocked(sellingApi.cancelAuction).mockResolvedValue(auction({ status: 'CANCELLED' }));
    renderCard(<SellerAuctionCard auction={auction()} />);

    await userEvent.click(screen.getByTestId('auction-withdraw'));
    const dialog = within(screen.getByRole('alertdialog'));
    expect(dialog.getByText(/Withdraw this listing/)).toBeTruthy();
    await userEvent.click(dialog.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(sellingApi.cancelAuction).toHaveBeenCalledWith('a1', undefined));
  });

  it('sends nothing when the seller changes their mind', async () => {
    renderCard(<SellerAuctionCard auction={auction()} />);
    await userEvent.click(screen.getByTestId('auction-withdraw'));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Keep it' }),
    );
    expect(sellingApi.cancelAuction).not.toHaveBeenCalled();
  });

  it('on 409 (reviewed first, or an older API) says so and refreshes the list', async () => {
    vi.mocked(sellingApi.cancelAuction).mockRejectedValue(conflict('AUCTION_NOT_CANCELLABLE'));
    const { invalidate } = renderCard(<SellerAuctionCard auction={auction()} />);

    await userEvent.click(screen.getByTestId('auction-withdraw'));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Withdraw' }),
    );
    expect((await screen.findByRole('alert')).textContent).toMatch(/can't be withdrawn any more/);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.selling.auctions });
  });

  it('a live listing keeps the usual "Cancel listing" wording', () => {
    renderCard(<SellerAuctionCard auction={auction({ status: 'LIVE' })} />);
    expect(screen.getByTestId('auction-cancel')).toHaveTextContent('Cancel listing');
    expect(screen.queryByTestId('auction-withdraw')).toBeNull();
  });
});

describe('SellerAuctionCard: List again', () => {
  const unsold = auction({ status: 'UNSOLD' });

  it('offers it while the product can still be auctioned', () => {
    renderCard(<SellerAuctionCard auction={unsold} relistable={new Set(['p1'])} />);
    expect(screen.getByTestId('auction-relist')).toBeTruthy();
  });

  it('hides it for a blocked, deleted or already re-listed product', () => {
    renderCard(<SellerAuctionCard auction={unsold} relistable={new Set()} />);
    expect(screen.queryByTestId('auction-relist')).toBeNull();
  });
});

describe('SellerAuctionCard: what each status shows', () => {
  it('rejected: the reason inline and "Fix and resubmit" to the editor', () => {
    renderCard(
      <SellerAuctionCard
        auction={auction({ status: 'REJECTED', rejectionReason: 'Photos unclear' })}
      />,
    );
    expect(screen.getByText('Reason: Photos unclear')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Fix and resubmit' }).getAttribute('href')).toBe(
      '/account/selling/auctions/a1',
    );
  });

  it('live with bids: no cancel, and says why', () => {
    renderCard(<SellerAuctionCard auction={auction({ status: 'LIVE', bidCount: 3 })} />);
    expect(screen.queryByTestId('auction-cancel')).toBeNull();
    expect(screen.getByText('It has bids, so it can no longer be cancelled.')).toBeTruthy();
  });

  it('List again opens the new-auction page pre-filled from this one', () => {
    renderCard(
      <SellerAuctionCard auction={auction({ status: 'UNSOLD' })} relistable={new Set(['p1'])} />,
    );
    expect(screen.getByTestId('auction-relist').getAttribute('href')).toBe(
      '/account/selling/auctions/new?relist=a1',
    );
  });
});
