import type { Metadata } from 'next';
import { resolveAssetUrl } from '@shared/lib/asset';
import { formatMoney } from '@shared/lib/money';
import {
  NOT_FOUND,
  type PublicAuction,
  type PublicResult,
  type PublicSeller,
  type PublicStore,
} from './public-data';

/*
 * Page metadata for link previews (WhatsApp, Facebook, Telegram) and search results. Arabic first —
 * the storefront's default locale and its main audience — with the English name alongside.
 */

export const SITE_NAME = 'مزاد Mazad';
const DESCRIPTION_MAX = 200;

/**
 * Public origin of the storefront, from NEXT_PUBLIC_SITE_URL. Only a bare http(s) origin is
 * trusted: canonical URLs and absolute Open Graph URLs are emitted only when it is configured.
 */
export function siteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const bare = url.pathname === '/' && !url.search && !url.hash && !url.username;
    return (url.protocol === 'https:' || url.protocol === 'http:') && bare ? url : undefined;
  } catch {
    return undefined;
  }
}

function truncate(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function bilingual(ar: string, en: string): string {
  return ar.trim() === en.trim() ? ar : `${ar} — ${en}`;
}

function coverImage(images: PublicAuction['product']['images']): string | null {
  const cover =
    images.find((image) => image.isCover) ??
    [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
  return resolveAssetUrl(cover?.url);
}

/** No data: a 404 stays out of indexes; an unavailable API only falls back to the site defaults. */
function fallback(result: typeof NOT_FOUND | null, title: string): Metadata {
  return result === NOT_FOUND ? { title, robots: { index: false } } : { title };
}

function withCanonical(path: string, metadata: Metadata): Metadata {
  return siteUrl() ? { ...metadata, alternates: { canonical: path } } : metadata;
}

const STATUS_AR: Record<string, string> = {
  LIVE: 'مزاد مباشر',
  SCHEDULED: 'مزاد قادم',
  ENDED: 'مزاد منتهٍ',
};

export function auctionMetadata(id: string, auction: PublicResult<PublicAuction>): Metadata {
  if (auction === null || auction === NOT_FOUND) return fallback(auction, 'مزاد');

  const { product } = auction;
  const title = bilingual(product.nameAr, product.nameEn);
  const price = formatMoney(auction.currentPrice ?? auction.startingPrice, 'ar');
  const status = STATUS_AR[auction.status] ?? 'مزاد';
  const description = truncate(
    [
      `${status} · السعر الحالي ${price} · ${auction.bidCount} مزايدة`,
      auction.store ? `${auction.store.nameAr}، ${auction.store.city}` : null,
      product.descriptionAr ?? product.descriptionEn ?? null,
    ]
      .filter(Boolean)
      .join(' · '),
  );
  const image = coverImage(product.images);

  return withCanonical(`/auctions/${id}`, {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ar_IQ',
      title,
      description,
      url: `/auctions/${id}`,
      ...(image ? { images: [{ url: image, alt: product.nameAr }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  });
}

export function storeMetadata(id: string, store: PublicResult<PublicStore>): Metadata {
  if (store === null || store === NOT_FOUND) return fallback(store, 'متجر');
  const title = bilingual(store.nameAr, store.nameEn);
  const description = truncate(`متجر على مزاد في ${store.city} · البائع ${store.seller.fullName}`);
  return withCanonical(`/stores/${id}`, {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'ar_IQ',
      title,
      description,
      url: `/stores/${id}`,
    },
    twitter: { card: 'summary', title, description },
  });
}

export function sellerMetadata(id: string, seller: PublicResult<PublicSeller>): Metadata {
  if (seller === null || seller === NOT_FOUND) return fallback(seller, 'بائع');
  const title = seller.fullName;
  const rating =
    seller.rating.average != null && seller.rating.count > 0
      ? ` · التقييم ${seller.rating.average.toFixed(1)} من ${seller.rating.count}`
      : '';
  const description = truncate(
    `${seller.isVerified ? 'بائع موثّق' : 'بائع'} على مزاد · ${seller.followerCount} متابع${rating}`,
  );
  return withCanonical(`/sellers/${id}`, {
    title,
    description,
    openGraph: {
      type: 'profile',
      siteName: SITE_NAME,
      locale: 'ar_IQ',
      title,
      description,
      url: `/sellers/${id}`,
    },
    twitter: { card: 'summary', title, description },
  });
}

/** schema.org Product + Offer for an auction page (rich results). Public fields only. */
export function auctionJsonLd(id: string, auction: PublicAuction): Record<string, unknown> {
  const base = siteUrl();
  const image = coverImage(auction.product.images);
  const amount = Number(auction.currentPrice ?? auction.startingPrice);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: auction.product.nameAr,
    alternateName: auction.product.nameEn,
    ...(image ? { image } : {}),
    ...(auction.product.descriptionAr
      ? { description: truncate(auction.product.descriptionAr, 500) }
      : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IQD',
      ...(Number.isFinite(amount) ? { price: amount.toFixed(0) } : {}),
      availability:
        auction.status === 'LIVE' || auction.status === 'SCHEDULED'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      priceValidUntil: auction.endsAt.slice(0, 10),
      ...(base ? { url: new URL(`/auctions/${id}`, base).toString() } : {}),
    },
  };
}
