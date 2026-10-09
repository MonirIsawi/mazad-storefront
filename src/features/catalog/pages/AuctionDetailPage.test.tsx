import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { catalogApi } from '../api/catalog.api';
import catalogAr from '../i18n/ar.json';
import catalogEn from '../i18n/en.json';
import { AuctionDetailPage } from './AuctionDetailPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
vi.mock('../api/catalog.api', () => ({
  catalogApi: { getAuction: vi.fn(), getAuctionBids: vi.fn(), getSimilarAuctions: vi.fn() },
}));

function apiError(status: number, errorCode: string) {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: {},
    data: { statusCode: status, errorCode },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
}

beforeAll(async () => {
  addNamespaceBundle('catalog', 'en', catalogEn);
  addNamespaceBundle('catalog', 'ar', catalogAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(catalogApi.getAuctionBids).mockResolvedValue([]);
  vi.mocked(catalogApi.getSimilarAuctions).mockResolvedValue([]);
});

describe('AuctionDetailPage: missing auction', () => {
  it('says the auction is gone and offers a way on, not a retry that cannot work', async () => {
    vi.mocked(catalogApi.getAuction).mockRejectedValue(apiError(404, 'AUCTION_NOT_FOUND'));
    renderWithQuery(<AuctionDetailPage id="gone" />);
    expect(await screen.findByText('Auction not found.')).toBeTruthy();
    const browse = screen.getByRole('link', { name: 'Browse auctions' });
    expect(browse.getAttribute('href')).toBe('/auctions');
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();
  });

  it('keeps a retry for a server failure, which can recover', async () => {
    vi.mocked(catalogApi.getAuction).mockRejectedValue(apiError(503, 'SERVICE_UNAVAILABLE'));
    renderWithQuery(<AuctionDetailPage id="a1" />);
    expect(await screen.findByText("Couldn't load this auction.")).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Browse auctions' })).toBeNull();
  });
});
