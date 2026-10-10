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

const MINUTE = 60_000;

/** A live auction as GET /auctions/:id returns it (already parsed). */
function auction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    status: 'LIVE',
    startingPrice: '100000.00',
    minIncrement: '5000.00',
    currentPrice: '125000.00',
    bidCount: 3,
    startsAt: '2026-10-01T10:00:00.000Z',
    endsAt: new Date(Date.now() + 90 * MINUTE + 30_000).toISOString(),
    originalEndsAt: new Date(Date.now() + 85 * MINUTE + 30_000).toISOString(),
    buyNowPrice: null,
    product: {
      id: 'p1',
      nameEn: 'Vintage camera',
      nameAr: 'كاميرا قديمة',
      condition: 'USED',
      marketPrice: null,
      images: [],
      coverImage: null,
      imageUrls: [],
      descriptionEn: 'A 1970s film camera, tested and working.',
      descriptionAr: 'كاميرا أفلام من السبعينيات.',
      category: { id: 'c1', slug: 'cameras', nameEn: 'Cameras', nameAr: 'كاميرات' },
    },
    seller: { id: 's1', fullName: 'Ali Hassan', isVerified: true },
    store: {
      id: 'st1',
      nameEn: 'Ali Store',
      nameAr: 'متجر علي',
      city: 'Baghdad',
      deliveryFee: '5000.00',
    },
    paymentMethods: ['CASH_ON_DELIVERY', 'CARD'],
    returnWindowDays: 7,
    sellerRating: { average: 4.6, count: 12 },
    ...overrides,
  } as never;
}

describe('AuctionDetailPage: what a buyer checks before bidding', () => {
  it('shows the description, category, times, extension, payment and returns', async () => {
    vi.mocked(catalogApi.getAuction).mockResolvedValue(auction());
    renderWithQuery(<AuctionDetailPage id="a1" />);
    expect(await screen.findByTestId('detail-description')).toHaveTextContent(
      'A 1970s film camera, tested and working.',
    );
    expect(screen.getByText('Cameras')).toBeTruthy();
    expect(screen.getByText('Starts')).toBeTruthy();
    expect(screen.getByText('Ends')).toBeTruthy();
    expect(screen.getByTestId('detail-extended')).toHaveTextContent('Extended by 5 minutes');
    expect(screen.getByText('Cash on delivery or card')).toBeTruthy();
    expect(screen.getByText('Within 7 days of delivery')).toBeTruthy();
  });

  it('offers cash on delivery only when card payment is off', async () => {
    vi.mocked(catalogApi.getAuction).mockResolvedValue(
      auction({ paymentMethods: ['CASH_ON_DELIVERY'] }),
    );
    renderWithQuery(<AuctionDetailPage id="a1" />);
    expect(await screen.findByText('Cash on delivery')).toBeTruthy();
  });

  it('shows every photo with a count and thumbnails', async () => {
    const urls = ['https://cdn.test/1.jpg', 'https://cdn.test/2.jpg', 'https://cdn.test/3.jpg'];
    vi.mocked(catalogApi.getAuction).mockResolvedValue(
      auction({
        product: {
          ...(auction() as { product: object }).product,
          imageUrls: urls,
          coverImage: urls[0],
        },
      }),
    );
    renderWithQuery(<AuctionDetailPage id="a1" />);
    expect(await screen.findByTestId('gallery-indicator')).toHaveTextContent('1 / 3');
    screen.getByRole('button', { name: 'Show photo 3 of 3' }).click();
    expect(await screen.findByText('3 / 3')).toBeTruthy();
  });

  it('counts down to an upcoming start and says when an auction ended', async () => {
    vi.mocked(catalogApi.getAuction).mockResolvedValue(
      auction({
        status: 'SCHEDULED',
        currentPrice: null,
        startsAt: new Date(Date.now() + 120 * MINUTE).toISOString(),
      }),
    );
    const view = renderWithQuery(<AuctionDetailPage id="a1" />);
    expect(await screen.findByTestId('detail-starts-in')).toHaveTextContent(/Starts in/);
    view.unmount();

    vi.mocked(catalogApi.getAuction).mockResolvedValue(
      auction({ status: 'SOLD', endsAt: '2026-10-05T18:00:00.000Z' }),
    );
    renderWithQuery(<AuctionDetailPage id="a2" />);
    expect(await screen.findByTestId('detail-ended-at')).toHaveTextContent(/^Ended /);
  });
});
