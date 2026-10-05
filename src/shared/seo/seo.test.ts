// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { auctionJsonLd, auctionMetadata, sellerMetadata, siteUrl, storeMetadata } from './metadata';
import { NOT_FOUND, fetchPublicAuction, type PublicAuction } from './public-data';

const auction: PublicAuction = {
  id: 'cauction1',
  status: 'LIVE',
  startingPrice: '100000.00',
  currentPrice: '125000.00',
  bidCount: 7,
  endsAt: '2026-10-07T18:00:00.000Z',
  product: {
    nameAr: 'آيفون ١٥ برو',
    nameEn: 'iPhone 15 Pro',
    descriptionAr: 'بحالة ممتازة مع العلبة',
    descriptionEn: 'Excellent condition, boxed',
    images: [
      { url: 'images/p1/2.webp', isCover: false, sortOrder: 2 },
      { url: 'images/p1/1.webp', isCover: true, sortOrder: 1 },
    ],
  },
  store: { nameAr: 'متجر بغداد', nameEn: 'Baghdad Store', city: 'Baghdad' },
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('auction metadata', () => {
  it('gives link previews a real title, price, description and the cover photo', () => {
    const meta = auctionMetadata('cauction1', auction);
    expect(meta.title).toBe('آيفون ١٥ برو — iPhone 15 Pro');
    expect(meta.description).toContain('مزاد مباشر');
    expect(meta.description).toContain('١٢٥,٠٠٠ د.ع');
    expect(meta.description).toContain('بحالة ممتازة');
    expect(meta.openGraph).toMatchObject({
      siteName: 'مزاد Mazad',
      url: '/auctions/cauction1',
      images: [{ url: expect.stringMatching(/\/images\/p1\/1\.webp$/) }],
    });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('keeps a missing page out of the index, but not one the API could not serve right now', () => {
    expect(auctionMetadata('missing', NOT_FOUND)).toEqual({
      title: 'مزاد',
      robots: { index: false },
    });
    expect(storeMetadata('missing', NOT_FOUND).robots).toEqual({ index: false });
    expect(sellerMetadata('missing', NOT_FOUND).robots).toEqual({ index: false });
    // API down: generic metadata, no noindex — a transient outage must not de-index real pages.
    expect(auctionMetadata('cauction1', null)).toEqual({ title: 'مزاد' });
  });

  it('emits a canonical URL only with a trustworthy NEXT_PUBLIC_SITE_URL', () => {
    expect(auctionMetadata('cauction1', auction).alternates).toBeUndefined();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mazad.example');
    expect(auctionMetadata('cauction1', auction).alternates).toEqual({
      canonical: '/auctions/cauction1',
    });
  });

  it.each([
    'mazad.example',
    'https://mazad.example/shop',
    'javascript:alert(1)',
    'ftp://x.example',
  ])('ignores the malformed site URL %s', (value) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', value);
    expect(siteUrl()).toBeUndefined();
  });

  it('describes the auction as a schema.org Product offer', () => {
    expect(auctionJsonLd('cauction1', auction)).toMatchObject({
      '@type': 'Product',
      name: 'آيفون ١٥ برو',
      offers: { priceCurrency: 'IQD', price: '125000', availability: 'https://schema.org/InStock' },
    });
  });
});

describe('store and seller metadata', () => {
  it('uses only public fields', () => {
    const store = storeMetadata('s1', {
      id: 's1',
      nameAr: 'متجر بغداد',
      nameEn: 'Baghdad Store',
      city: 'Baghdad',
      seller: { fullName: 'Ali' },
    });
    expect(store.title).toBe('متجر بغداد — Baghdad Store');
    const seller = sellerMetadata('u1', {
      id: 'u1',
      fullName: 'Ali',
      isVerified: true,
      followerCount: 12,
      rating: { average: 4.5, count: 8 },
    });
    expect(seller.description).toBe('بائع موثّق على مزاد · 12 متابع · التقييم 4.5 من 8');
  });
});

describe('server-side public fetch', () => {
  it('falls back to null when the API fails, and never fetches a malformed id', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.invalid/api/v1');
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPublicAuction('cauction1')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.invalid/api/v1/auctions/cauction1',
      expect.not.objectContaining({ credentials: 'include' }),
    );

    fetchMock.mockClear();
    await expect(fetchPublicAuction('../admin/users')).resolves.toBe(NOT_FOUND);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the parsed auction, or null for an unexpected shape', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.invalid/api/v1');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(auction))));
    await expect(fetchPublicAuction('cauction1')).resolves.toMatchObject({ id: 'cauction1' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }))));
    await expect(fetchPublicAuction('cauction1')).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 404 })));
    await expect(fetchPublicAuction('cauction1')).resolves.toBe(NOT_FOUND);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 503 })));
    await expect(fetchPublicAuction('cauction1')).resolves.toBeNull();
  });
});
