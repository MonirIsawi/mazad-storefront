import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { catalogApi } from '../api/catalog.api';
import catalogAr from '../i18n/ar.json';
import catalogEn from '../i18n/en.json';
import { SellerCard } from '../components/auction/SellerCard';
import { auctionSchema } from '../schemas/catalog.schema';
import type { BidHistoryItem } from '../types/catalog.types';
import { AuctionDetailPage } from './AuctionDetailPage';
import { BidHistoryPage } from './BidHistoryPage';

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

async function setLanguage(locale: 'en' | 'ar') {
  useLocaleStore.getState().setLocale(locale);
  await i18n.changeLanguage(locale);
}

beforeAll(async () => {
  addNamespaceBundle('catalog', 'en', catalogEn);
  addNamespaceBundle('catalog', 'ar', catalogAr);
  await setLanguage('en');
});

beforeEach(() => {
  vi.mocked(catalogApi.getAuctionBids).mockResolvedValue([]);
  vi.mocked(catalogApi.getSimilarAuctions).mockResolvedValue([]);
});

afterEach(async () => {
  await setLanguage('en');
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

/** GET /auctions/:id as mazad-api sends it, parsed by the real schema (as catalogApi does). */
function auction(overrides: Record<string, unknown> = {}, product: Record<string, unknown> = {}) {
  return auctionSchema.parse({
    id: 'a1',
    status: 'LIVE',
    startingPrice: '100000.00',
    minIncrement: '5000.00',
    bidIncrement: '5000.00',
    currentPrice: '125000.00',
    bidCount: 5,
    bidderCount: 3,
    startsAt: '2026-10-01T10:00:00.000Z',
    endsAt: new Date(Date.now() + 90 * MINUTE + 30_000).toISOString(),
    originalEndsAt: new Date(Date.now() + 85 * MINUTE + 30_000).toISOString(),
    buyNowPrice: null,
    deliveryFee: '5000.00',
    product: {
      id: 'p1',
      nameEn: 'Vintage camera',
      nameAr: 'كاميرا قديمة',
      condition: 'USED',
      marketPrice: null,
      images: [],
      descriptionEn: 'A 1970s film camera.\nTested and working.',
      descriptionAr: 'كاميرا أفلام من السبعينيات.',
      category: {
        id: 'c2',
        slug: 'film-cameras',
        nameEn: 'Film cameras',
        nameAr: 'كاميرات أفلام',
        parent: { id: 'c1', slug: 'cameras', nameEn: 'Cameras', nameAr: 'كاميرات' },
      },
      variants: [
        { id: 'v1', nameEn: 'Brand', nameAr: 'العلامة', valueEn: 'Canon', valueAr: 'كانون' },
        { id: 'v2', nameEn: 'Lens', nameAr: '', valueEn: '50 mm', valueAr: '' },
      ],
      ...product,
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
  });
}

async function renderAuction(data: ReturnType<typeof auction>) {
  vi.mocked(catalogApi.getAuction).mockResolvedValue(data);
  renderWithQuery(<AuctionDetailPage id={data.id} />);
  return screen.findByTestId('detail-prices');
}

const priceRow = (testId: string) => screen.getByTestId(testId).textContent;

describe('AuctionDetailPage: photos', () => {
  it('shows every photo, cover first, with a count and small thumbnails', async () => {
    await renderAuction(
      auction(
        {},
        {
          images: [
            { id: 'i2', url: 'https://cdn.test/2.jpg', sortOrder: 0, isCover: false },
            {
              id: 'i1',
              url: 'https://cdn.test/1.jpg',
              thumbUrl: 'https://cdn.test/1-thumb.jpg',
              sortOrder: 1,
              isCover: true,
            },
            { id: 'i3', url: 'https://cdn.test/3.jpg', sortOrder: 2, isCover: false },
          ],
        },
      ),
    );
    expect(screen.getByTestId('gallery-indicator')).toHaveTextContent('1 / 3');
    // The cover leads, at full size; the strip uses the thumbnail (or the photo when none).
    const cover = screen.getByRole('img', { name: 'Vintage camera, photo 1 of 3' });
    expect(decodeURIComponent(cover.getAttribute('src') ?? '')).toContain('cdn.test/1.jpg');
    const thumb = screen.getByRole('button', { name: 'Photo 1 of 3' }).querySelector('img');
    expect(decodeURIComponent(thumb?.getAttribute('src') ?? '')).toContain('1-thumb.jpg');
    await userEvent.click(screen.getByRole('button', { name: 'Show photo 3 of 3' }));
    expect(await screen.findByText('3 / 3')).toBeTruthy();
    // Any photo opens full screen.
    await userEvent.click(screen.getByRole('button', { name: 'View photo 1 of 3 full screen' }));
    expect(screen.getByRole('dialog', { name: 'Product photos' })).toBeTruthy();
  });
});

describe('AuctionDetailPage: prices', () => {
  it('a live auction with bids: current price, opening bid, next raise and delivery', async () => {
    await renderAuction(auction());
    const prices = screen.getByTestId('detail-prices');
    expect(within(prices).getByText('Top bid')).toBeTruthy();
    expect(screen.getByTestId('detail-main-price')).toHaveTextContent(/^125,000\s?IQD$/);
    expect(within(prices).getByText('Step 5,000 IQD')).toBeTruthy();
    const rules = within(screen.getByTestId('detail-rules'));
    expect(rules.getByText('Opening price').nextSibling).toHaveTextContent('100,000 IQD');
    expect(rules.getByText('Bid step').nextSibling).toHaveTextContent('5,000 IQD');
    expect(screen.getByTestId('price-delivery')).toHaveTextContent(
      'Delivery from Baghdad5,000 IQD',
    );
    // No buy now, no market price, and never a "total" for a live bid.
    expect(screen.queryByTestId('price-buy-now')).toBeNull();
    expect(screen.queryByTestId('price-market')).toBeNull();
    expect(screen.queryByText(/total/i)).toBeNull();
  });

  it('no bids yet: the opening bid is the main price, not repeated', async () => {
    await renderAuction(auction({ currentPrice: null, bidCount: 0, bidderCount: 0 }));
    const prices = screen.getByTestId('detail-prices');
    expect(within(prices).getAllByText('Opening price')).toHaveLength(1);
    expect(within(screen.getByTestId('detail-rules')).queryByText('Opening price')).toBeNull();
    expect(screen.getByTestId('detail-main-price')).toHaveTextContent(/^100,000\s?IQD$/);
    expect(screen.getByTestId('detail-activity')).toHaveTextContent('No bids yet');
  });

  it('buy now with its total including delivery, the new retail price and the saving', async () => {
    await renderAuction(auction({ buyNowPrice: '300000.00' }, { marketPrice: '400000.00' }));
    expect(priceRow('price-buy-now')).toBe('Buy now300,000 IQD');
    expect(priceRow('price-buy-now-total')).toBe('Buy now total with delivery305,000 IQD');
    expect(priceRow('price-market')).toBe('New retail price400,000 IQD');
    const savings = screen.getAllByTestId('price-saving').map((note) => note.textContent);
    // Below the main price (400,000 − 125,000) and below buy now (400,000 − 300,000).
    expect(savings).toEqual([
      'That is 275,000 IQD below the new retail price',
      '100,000 IQD below the new price',
    ]);
    expect(screen.queryByText(/original price/i)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('no saving line when the new retail price is not higher; no buy now once reached', async () => {
    await renderAuction(
      auction(
        { buyNowPrice: '120000.00', currentPrice: '125000.00' },
        { marketPrice: '110000.00' },
      ),
    );
    expect(priceRow('price-market')).toBe('New retail price110,000 IQD');
    expect(screen.queryByTestId('price-saving')).toBeNull();
    expect(screen.queryByTestId('price-buy-now')).toBeNull();
    expect(screen.queryByTestId('price-buy-now-total')).toBeNull();
  });

  it('a sold auction says "Sold for", with no next raise or buy now', async () => {
    await renderAuction(
      auction({ status: 'SOLD', buyNowPrice: '300000.00', endsAt: '2026-10-05T18:00:00.000Z' }),
    );
    expect(within(screen.getByTestId('detail-prices')).getByText('Sold for')).toBeTruthy();
    expect(screen.queryByText('Next raise')).toBeNull();
    expect(screen.queryByTestId('price-buy-now')).toBeNull();
    expect(screen.getByTestId('detail-ended-at')).toHaveTextContent(/^Ended /);
  });

  it('a zero delivery fee reads "No delivery fee", never "free shipping"', async () => {
    await renderAuction(auction({ deliveryFee: '0.00' }));
    for (const row of screen.getAllByTestId('price-delivery')) {
      expect(row).toHaveTextContent('Delivery from BaghdadNo delivery fee');
    }
    expect(screen.queryByText(/free/i)).toBeNull();
  });
});

describe('AuctionDetailPage: auction information', () => {
  it('shows bidders and bids, the exact start and end, and the extension', async () => {
    await renderAuction(auction());
    expect(screen.getByTestId('detail-activity')).toHaveTextContent('5 bids3 bidders');
    expect(screen.getByText('Starts')).toBeTruthy();
    expect(screen.getByText('Ends')).toBeTruthy();
    expect(screen.getByTestId('detail-extended')).toHaveTextContent('Extended by 5 minutes');
  });

  it('counts down to an upcoming start', async () => {
    await renderAuction(
      auction({
        status: 'SCHEDULED',
        currentPrice: null,
        startsAt: new Date(Date.now() + 120 * MINUTE).toISOString(),
      }),
    );
    expect(screen.getByTestId('detail-starts-in')).toHaveTextContent(/Starts in/);
  });
});

describe('AuctionDetailPage: the product', () => {
  it('shows the full description with its line breaks', async () => {
    await renderAuction(auction());
    const description = screen.getByTestId('detail-description');
    expect(description.textContent).toBe('A 1970s film camera.\nTested and working.');
    expect(description.className).toContain('whitespace-pre-wrap');
    expect(screen.getByText('About this item')).toBeTruthy();
  });

  it('condition explained, main category and subcategory, then the specifications', async () => {
    await renderAuction(auction());
    const info = within(screen.getByTestId('detail-product-info'));
    expect(info.getByText('Used')).toBeTruthy();
    expect(info.getByText('Used, with signs of use the seller describes.')).toBeTruthy();
    expect(info.getByText('Category').nextSibling).toHaveTextContent('Cameras');
    expect(info.getByText('Subcategory').nextSibling).toHaveTextContent('Film cameras');
    expect(info.getByText('Brand').nextSibling).toHaveTextContent('Canon');
    expect(info.getByText('Lens').nextSibling).toHaveTextContent('50 mm');
    expect(info.queryByText('USED')).toBeNull();
  });

  it('a category without a parent is the category, with no subcategory row', async () => {
    await renderAuction(
      auction(
        {},
        {
          category: { id: 'c1', slug: 'cameras', nameEn: 'Cameras', nameAr: 'كاميرات' },
          variants: [],
        },
      ),
    );
    const info = within(screen.getByTestId('detail-product-info'));
    expect(info.getByText('Category').nextSibling).toHaveTextContent('Cameras');
    expect(info.queryByText('Subcategory')).toBeNull();
  });
});

describe('AuctionDetailPage: delivery, payment and returns', () => {
  it('lists cash on delivery and card when the API offers card', async () => {
    await renderAuction(auction());
    const methods = screen.getByTestId('detail-payment-methods');
    expect(
      within(methods)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Cash on delivery', 'Card']);
  });

  it('lists cash on delivery only when card payment is off', async () => {
    await renderAuction(auction({ paymentMethods: ['CASH_ON_DELIVERY'] }));
    const methods = screen.getByTestId('detail-payment-methods');
    expect(
      within(methods)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Cash on delivery']);
  });

  it('takes the return window from the API', async () => {
    await renderAuction(auction({ returnWindowDays: 14 }));
    expect(screen.getByTestId('detail-returns')).toHaveTextContent('Within 14 days of delivery');
  });
});

describe('AuctionDetailPage: the seller', () => {
  it('a verified seller with reviews: badge, rating and the way to the store', async () => {
    await renderAuction(auction());
    const seller = within(screen.getByTestId('detail-seller'));
    expect(seller.getByText('Ali Store')).toBeTruthy();
    expect(seller.getByRole('link', { name: 'Ali Hassan' }).getAttribute('href')).toBe(
      '/sellers/s1',
    );
    expect(seller.getByText('Baghdad')).toBeTruthy();
    expect(seller.getByTestId('seller-verified')).toHaveTextContent('Verified seller');
    expect(seller.getByTestId('seller-rating')).toHaveTextContent('★ 4.6 (12 reviews)');
    expect(seller.getByRole('link', { name: 'View store' }).getAttribute('href')).toBe(
      '/stores/st1',
    );
  });

  it('no badge for an unverified seller, and no rating before the first review', async () => {
    await renderAuction(
      auction({
        seller: { id: 's1', fullName: 'Ali Hassan', isVerified: false },
        sellerRating: { average: null, count: 0 },
      }),
    );
    const seller = within(screen.getByTestId('detail-seller'));
    expect(seller.queryByTestId('seller-verified')).toBeNull();
    expect(seller.getByTestId('seller-rating')).toHaveTextContent('No reviews yet');
    expect(seller.queryByText(/★/)).toBeNull();
  });

  it('View store goes to the store by its own id, never the seller id', async () => {
    await renderAuction(
      auction({
        seller: { id: 'seller-9', fullName: 'Ali Hassan', isVerified: true },
        store: {
          id: 'store-42',
          nameEn: 'Ali Store',
          nameAr: 'متجر علي',
          city: 'Baghdad',
          deliveryFee: '5000.00',
        },
      }),
    );
    const seller = within(screen.getByTestId('detail-seller'));
    expect(seller.getByRole('link', { name: 'View store' }).getAttribute('href')).toBe(
      '/stores/store-42',
    );
    expect(seller.getByRole('link', { name: 'Ali Hassan' }).getAttribute('href')).toBe(
      '/sellers/seller-9',
    );
  });

  it('one seller with two stores: each auction links to its own store', () => {
    const store = (id: string, nameEn: string) => ({
      id,
      nameEn,
      nameAr: nameEn,
      city: 'Baghdad',
      deliveryFee: '5000.00',
    });
    renderWithQuery(
      <>
        <SellerCard auction={auction({ id: 'a1', store: store('st-a', 'Store A') })} />
        <SellerCard auction={auction({ id: 'a2', store: store('st-b', 'Store B') })} />
      </>,
    );
    const cards = screen.getAllByTestId('detail-seller').map((card) => within(card));
    expect(cards.map((card) => card.getByText(/^Store [AB]$/).textContent)).toEqual([
      'Store A',
      'Store B',
    ]);
    expect(
      cards.map((card) => card.getByRole('link', { name: 'View store' }).getAttribute('href')),
    ).toEqual(['/stores/st-a', '/stores/st-b']);
  });
});

describe('AuctionDetailPage: bid history', () => {
  const bid = (n: number, extra: Partial<BidHistoryItem> = {}): BidHistoryItem => ({
    id: `b${n}`,
    amount: String(100_000 + n * 5_000),
    createdAt: '2026-10-05T10:00:00.000Z',
    isAutoBid: false,
    isMine: false,
    bidder: { maskedName: `Bidder ${n}`, fullName: `Bidder Full ${n}` },
    ...extra,
  });

  it('marks the viewer\'s own bids "You" and automatic ones "Auto"; others by full name', async () => {
    vi.mocked(catalogApi.getAuctionBids).mockResolvedValue([
      bid(3, { isMine: true }),
      bid(2, { isAutoBid: true }),
      bid(1),
    ]);
    await renderAuction(auction());
    const rows = within(await screen.findByTestId('bid-history')).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent(/^You/);
    expect(rows[0]).not.toHaveTextContent('Bidder Full 3');
    expect(rows[1]).toHaveTextContent(/^Bidder Full 2.*Auto/);
    expect(rows[2]).toHaveTextContent(/^Bidder Full 1/);
    expect(rows[2]).not.toHaveTextContent('Auto');
  });

  it('falls back to maskedName from older API builds (it carries the full name too)', async () => {
    vi.mocked(catalogApi.getAuctionBids).mockResolvedValue([
      bid(1, { bidder: { maskedName: 'Ahmed Kareem' } }),
    ]);
    await renderAuction(auction());
    const rows = within(await screen.findByTestId('bid-history')).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent(/^Ahmed Kareem/);
  });

  it('shows the latest five, with the way to the full history', async () => {
    vi.mocked(catalogApi.getAuctionBids).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => bid(12 - i)),
    );
    await renderAuction(auction());
    const list = await screen.findByTestId('bid-history');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('link', { name: 'See all (12)' }).getAttribute('href')).toBe(
      '/auctions/a1/bids',
    );
  });

  it('the history screen lists every bid with the counts', async () => {
    vi.mocked(catalogApi.getAuction).mockResolvedValue(auction({ extensionsCount: 1 }));
    vi.mocked(catalogApi.getAuctionBids).mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => bid(12 - i)),
    );
    renderWithQuery(<BidHistoryPage id="a1" />);
    const list = await screen.findByTestId('bid-history');
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText('extension')).toBeTruthy();
  });
});

describe('AuctionDetailPage: in Arabic', () => {
  it('uses the Arabic name, labels and plural forms', async () => {
    await setLanguage('ar');
    await renderAuction(auction({ buyNowPrice: '300000.00' }, { marketPrice: '400000.00' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('كاميرا قديمة');
    const prices = within(screen.getByTestId('detail-prices'));
    expect(prices.getByText('أعلى مزايدة')).toBeTruthy();
    expect(within(screen.getByTestId('detail-rules')).getByText('سعر الافتتاح')).toBeTruthy();
    expect(priceRow('price-market')).toBe('سعر المنتج الجديد400,000 د.ع');
    expect(priceRow('price-buy-now-total')).toBe('الإجمالي مع التوصيل عند الشراء الآن305,000 د.ع');
    expect(screen.getAllByTestId('price-saving')[0]).toHaveTextContent(
      'أقل بـ 275,000 د.ع من سعره جديداً',
    );
    expect(screen.getByTestId('detail-activity')).toHaveTextContent('5 مزايدات3 مزايدين');
    const info = within(screen.getByTestId('detail-product-info'));
    expect(info.getByText('الفئة الفرعية').nextSibling).toHaveTextContent('كاميرات أفلام');
    expect(info.getByText('العلامة').nextSibling).toHaveTextContent('كانون');
    // No Arabic for this specification: the English one, never a blank row.
    expect(info.getByText('Lens').nextSibling).toHaveTextContent('50 mm');
    expect(screen.getByTestId('detail-returns')).toHaveTextContent('خلال 7 أيام من الاستلام');
    expect(
      within(screen.getByTestId('detail-payment-methods'))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['الدفع عند الاستلام', 'الدفع بالبطاقة']);
  });

  it('falls back to the English name when there is no Arabic one', async () => {
    await setLanguage('ar');
    await renderAuction(auction({}, { nameAr: '' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Vintage camera');
  });
});
