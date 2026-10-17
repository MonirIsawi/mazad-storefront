import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import { httpClient } from '@shared/api';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import catalogAr from '../i18n/ar.json';
import catalogEn from '../i18n/en.json';
import { storePageSchema } from '../schemas/catalog.schema';
import { StorePage } from './StorePage';

const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
// The real catalogApi (and so the real schema) runs; only the network is faked.
vi.mock('@shared/api', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  httpClient: { get: vi.fn() },
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

async function setLanguage(locale: 'en' | 'ar') {
  useLocaleStore.getState().setLocale(locale);
  await i18n.changeLanguage(locale);
}

/** GET /stores/:id exactly as mazad-api sends it now: no address, phone or pin. */
function storeBody(overrides: Record<string, unknown> = {}) {
  return {
    id: 'st1',
    name: 'Ali Store',
    nameEn: 'Ali Store',
    nameAr: 'متجر علي',
    city: 'Baghdad',
    deliveryFee: '5000.00',
    seller: { id: 's1', fullName: 'Ali Hassan', isVerified: true },
    sellerRating: { average: 4.6, count: 12 },
    auctions: [],
    ...overrides,
  };
}

const listing = {
  id: 'a1',
  status: 'LIVE',
  startingPrice: '100000.00',
  minIncrement: '5000.00',
  currentPrice: '125000.00',
  bidCount: 5,
  bidderCount: 3,
  startsAt: '2026-10-01T10:00:00.000Z',
  endsAt: '2099-01-01T10:00:00.000Z',
  originalEndsAt: '2099-01-01T10:00:00.000Z',
  buyNowPrice: null,
  product: {
    id: 'p1',
    nameEn: 'Vintage camera',
    nameAr: 'كاميرا قديمة',
    condition: 'USED',
    marketPrice: null,
    images: [],
  },
  seller: { id: 's1', fullName: 'Ali Hassan', isVerified: true },
  store: {
    id: 'st1',
    nameEn: 'Ali Store',
    nameAr: 'متجر علي',
    city: 'Baghdad',
    deliveryFee: '5000.00',
  },
};

/**
 * Answers /stores/:id with `store` (a body, or an error to throw), the live tab of /auctions with
 * `listings`, and /stores/:id/reviews with `reviews` (by default a 404: an API without ratings).
 */
function mockApi(
  store: unknown,
  listings: unknown[] = [],
  reviews: unknown = apiError(404, 'NOT_FOUND'),
) {
  vi.mocked(httpClient.get).mockImplementation(async (url: string, config?: unknown) => {
    if (url.endsWith('/reviews')) {
      if (reviews instanceof Error) throw reviews;
      return { data: reviews } as AxiosResponse;
    }
    if (url.startsWith('/stores/')) {
      if (store instanceof Error) throw store;
      return { data: store } as AxiosResponse;
    }
    const status = (config as { params?: { status?: string } } | undefined)?.params?.status;
    const data = status === 'live' ? listings : [];
    return {
      data: { data, meta: { page: 1, limit: 24, total: data.length, totalPages: 1 } },
    } as AxiosResponse;
  });
}

const storeRequests = () =>
  vi.mocked(httpClient.get).mock.calls.filter(([url]) => /^\/stores\/[^/]+$/.test(url)).length;

beforeAll(async () => {
  addNamespaceBundle('catalog', 'en', catalogEn);
  addNamespaceBundle('catalog', 'ar', catalogAr);
  await setLanguage('en');
});

beforeEach(() => {
  vi.mocked(httpClient.get).mockReset();
  router.push.mockReset();
  router.back.mockReset();
});

afterEach(async () => {
  await setLanguage('en');
});

describe('storePageSchema', () => {
  it('parses the public store response with and without a seller rating', () => {
    expect(storePageSchema.parse(storeBody()).sellerRating).toEqual({ average: 4.6, count: 12 });
    const older: Record<string, unknown> = storeBody();
    delete older.sellerRating;
    expect(storePageSchema.parse(older).sellerRating).toBeUndefined();
  });

  it('drops an address, phone or pin if one were ever sent', () => {
    const parsed = storePageSchema.parse(
      storeBody({
        area: 'Karrada',
        street: '62 St',
        details: 'Near the bridge',
        contactPhone: '07701234567',
        lat: 33.3,
        lng: 44.4,
      }),
    );
    for (const key of ['area', 'street', 'details', 'contactPhone', 'lat', 'lng']) {
      expect(parsed).not.toHaveProperty(key);
    }
  });
});

describe('StorePage: the store', () => {
  it('shows the store, its seller, the badge and rating, and its own listings', async () => {
    mockApi(storeBody(), [listing]);
    renderWithQuery(
      <StorePage
        id="st1"
        renderSellerFollowToggle={(sellerId) => <span>follow {sellerId}</span>}
      />,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Ali Store/ })).toBeTruthy();
    expect(screen.getByText('Baghdad')).toBeTruthy();
    expect(screen.getByText('delivery fee').nextSibling).toHaveTextContent('5,000');
    expect(screen.getByRole('link', { name: /Ali Hassan/ }).getAttribute('href')).toBe(
      '/sellers/s1',
    );
    expect(screen.getByText('follow s1')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Verified seller' })).toBeTruthy();
    expect(screen.getByTestId('store-rating')).toHaveTextContent('4.6');
    expect(screen.getByTestId('store-rating')).toHaveTextContent('12 ratings');
    expect(await screen.findByText('Vintage camera')).toBeTruthy();
    expect(httpClient.get).toHaveBeenCalledWith('/stores/st1');
    expect(httpClient.get).toHaveBeenCalledWith('/auctions', {
      params: { storeId: 'st1', status: 'live', page: 1, limit: 24 },
    });
  });

  it('no badge for an unverified seller, and no rating before the first review', async () => {
    mockApi(
      storeBody({
        seller: { id: 's1', fullName: 'Ali Hassan', isVerified: false },
        sellerRating: { average: null, count: 0 },
      }),
    );
    renderWithQuery(<StorePage id="st1" />);
    expect(await screen.findByText('Ali Store')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Verified seller' })).toBeNull();
    expect(screen.queryByTestId('store-rating')).toBeNull();
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it('no rating from an older API that does not send one', async () => {
    const older: Record<string, unknown> = storeBody();
    delete older.sellerRating;
    mockApi(older);
    renderWithQuery(<StorePage id="st1" />);
    expect(await screen.findByText('Ali Store')).toBeTruthy();
    expect(screen.queryByTestId('store-rating')).toBeNull();
    expect(screen.getByRole('img', { name: 'Verified seller' })).toBeTruthy();
  });

  it('never shows a phone or street, even if the API sent one', async () => {
    mockApi(
      storeBody({
        area: 'Karrada',
        street: '62 St',
        details: 'Near the bridge',
        contactPhone: '07701234567',
      }),
    );
    const { container } = renderWithQuery(<StorePage id="st1" />);
    expect(await screen.findByText('Ali Store')).toBeTruthy();
    for (const text of ['Karrada', '62 St', 'Near the bridge', '07701234567']) {
      expect(container.textContent).not.toContain(text);
    }
  });
});

describe('StorePage: when the store cannot be shown', () => {
  it('a missing store: says so, offers Back and Browse auctions, and no retry', async () => {
    mockApi(apiError(404, 'STORE_NOT_FOUND'));
    renderWithQuery(<StorePage id="gone" />);
    expect(await screen.findByText('Store not found')).toBeTruthy();
    expect(screen.getByText('The store may have been removed or suspended.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse auctions' }).getAttribute('href')).toBe(
      '/auctions',
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();
  });

  it('Back goes back when there is history, and home when there is none', async () => {
    mockApi(apiError(404, 'STORE_NOT_FOUND'));
    renderWithQuery(<StorePage id="gone" />);
    const back = await screen.findByRole('button', { name: 'Back' });
    const length = vi.spyOn(window.history, 'length', 'get');
    length.mockReturnValue(1);
    await userEvent.click(back);
    expect(router.push).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
    length.mockReturnValue(3);
    await userEvent.click(back);
    expect(router.back).toHaveBeenCalledTimes(1);
    length.mockRestore();
  });

  it('a missing store in Arabic', async () => {
    await setLanguage('ar');
    mockApi(apiError(404, 'STORE_NOT_FOUND'));
    renderWithQuery(<StorePage id="gone" />);
    expect(await screen.findByText('المتجر غير موجود')).toBeTruthy();
    expect(screen.getByText('قد يكون المتجر قد تم حذفه أو إيقافه.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'تصفّح المزادات' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'رجوع' })).toBeTruthy();
  });

  it('a forbidden store: not available, with Back and Browse auctions, and no retry', async () => {
    mockApi(apiError(403, 'FORBIDDEN'));
    renderWithQuery(<StorePage id="st1" />);
    expect(await screen.findByText("This store isn't available")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse auctions' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retry|try again/i })).toBeNull();
  });

  it('a server failure keeps a retry, which asks again', async () => {
    mockApi(apiError(503, 'SERVICE_UNAVAILABLE'));
    renderWithQuery(<StorePage id="st1" />);
    const alert = within(await screen.findByRole('alert', {}, { timeout: 4000 }));
    expect(alert.getByText("Couldn't load this store.")).toBeTruthy();
    expect(screen.queryByText('Store not found')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Browse auctions' })).toBeNull();
    // One automatic retry for a server failure (404/403 get none), then the buyer's Retry.
    expect(storeRequests()).toBe(2);
    mockApi(storeBody());
    await userEvent.click(alert.getByRole('button', { name: /retry|try again/i }));
    expect(await screen.findByText('Ali Store')).toBeTruthy();
    expect(storeRequests()).toBe(3);
  });

  it('a network failure keeps a retry', async () => {
    mockApi(new AxiosError('Network Error', 'ERR_NETWORK'));
    renderWithQuery(<StorePage id="st1" />);
    const alert = within(await screen.findByRole('alert', {}, { timeout: 4000 }));
    expect(alert.getByRole('button', { name: /retry|try again/i })).toBeTruthy();
  });

  it('an unexpected response shape is a retryable error, not "not found"', async () => {
    mockApi({ id: 'st1' });
    renderWithQuery(<StorePage id="st1" />);
    const alert = within(await screen.findByRole('alert', {}, { timeout: 4000 }));
    expect(alert.getByText("Couldn't load this store.")).toBeTruthy();
    expect(alert.getByRole('button', { name: /retry|try again/i })).toBeTruthy();
  });
});

/** GET /stores/:id/reviews as the Bidoom contract defines it (mocked: no local API has it yet). */
const reviewsBody = {
  summary: {
    avg: 4.5,
    count: 2,
    distribution: [0, 0, 0, 1, 1],
    topTags: [
      { tag: 'AS_DESCRIBED', count: 2 },
      { tag: 'SOMETHING_NEW', count: 1 },
    ],
  },
  items: [
    {
      id: 'r1',
      rating: 5,
      tags: ['AS_DESCRIBED', 'FAST_DELIVERY'],
      comment: 'Exactly as shown.',
      authorName: 'Zainab Kareem',
      itemName: 'Vintage camera',
      itemNameEn: 'Vintage camera',
      itemNameAr: 'كاميرا قديمة',
      createdAt: '2026-10-10T10:00:00.000Z',
      updatedAt: '2026-10-10T10:00:00.000Z',
      reply: { text: 'Thank you, enjoy it.', createdAt: '2026-10-11T10:00:00.000Z' },
    },
    {
      id: 'r2',
      rating: 4,
      tags: [],
      comment: null,
      authorName: 'Hussein Ali',
      itemName: 'Old radio',
      itemNameEn: 'Old radio',
      itemNameAr: 'راديو قديم',
      createdAt: '2026-10-09T10:00:00.000Z',
      updatedAt: '2026-10-09T10:00:00.000Z',
      reply: null,
    },
  ],
  nextCursor: null,
};

describe('StorePage: the Bidoom storefront (API with covers and ratings)', () => {
  const bidoomStore = storeBody({
    coverUrl: 'covers/st1.webp',
    isVerified: true,
    rating: { avg: 4.5, count: 2 },
    followers: 1810,
    liveCount: 9,
    soldCount: 204,
  });

  it('shows the cover, the store rating and its numbers', async () => {
    mockApi(bidoomStore, [listing], reviewsBody);
    const { container } = renderWithQuery(<StorePage id="st1" />);
    expect(await screen.findByText('Ali Store')).toBeTruthy();
    expect(
      container.querySelector('img[src*="covers%2Fst1.webp"], img[src*="covers/st1.webp"]'),
    ).toBeTruthy();
    expect(screen.getByText('live auctions').nextSibling).toHaveTextContent('9');
    expect(screen.getByText('followers').nextSibling).toHaveTextContent('1,810');
    expect(screen.getByText('sales').nextSibling).toHaveTextContent('204');
    // The store's own rating, not the seller's 4.6 over 12.
    expect(screen.getByTestId('store-rating')).toHaveTextContent('4.5');
    expect(screen.getByTestId('store-rating')).toHaveTextContent('2 ratings');
  });

  it('adds the Ratings tab; the rating under the name opens it', async () => {
    mockApi(bidoomStore, [listing], reviewsBody);
    renderWithQuery(<StorePage id="st1" />);
    const tab = await screen.findByRole('tab', { name: /Ratings/ });
    expect(tab).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(screen.getByTestId('store-rating'));
    expect(screen.getByRole('tab', { name: /Ratings/ })).toHaveAttribute('aria-selected', 'true');
    const panel = within(screen.getByRole('tabpanel'));
    expect(
      panel.getByText('Every rating comes from a buyer who received an order from this store.'),
    ).toBeTruthy();
    expect(panel.getByText('Exactly as shown.')).toBeTruthy();
    expect(panel.getByText('Item: Vintage camera')).toBeTruthy();
    expect(panel.getByText('Thank you, enjoy it.')).toBeTruthy();
    expect(panel.getByText('Store reply')).toBeTruthy();
    expect(panel.getAllByText('As described').length).toBe(2);
    expect(panel.getByText('Fast delivery')).toBeTruthy();
    // A tag this client doesn't know is left out rather than shown raw.
    expect(panel.queryByText(/SOMETHING_NEW/)).toBeNull();
    expect(panel.getByLabelText('5 stars: 1')).toBeTruthy();
  });

  it('opens on the Ratings tab from a ?tab=ratings link', async () => {
    mockApi(bidoomStore, [listing], reviewsBody);
    renderWithQuery(<StorePage id="st1" initialTab="ratings" />);
    expect(await screen.findByText('Zainab Kareem')).toBeTruthy();
  });

  it('an API without store ratings (404): no Ratings tab, and a ratings link lands on Live', async () => {
    mockApi(storeBody(), [listing]);
    renderWithQuery(<StorePage id="st1" initialTab="ratings" />);
    expect(await screen.findByText('Vintage camera')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /Ratings/ })).toBeNull();
    expect(screen.getByRole('tab', { name: /Live/ })).toHaveAttribute('aria-selected', 'true');
    // The rating stays as text: there is no tab for it to open.
    expect(screen.getByTestId('store-rating').tagName).toBe('SPAN');
    expect(screen.queryByText('followers')).toBeNull();
    expect(screen.queryByText('sales')).toBeNull();
  });
});
