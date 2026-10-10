'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { EmptyState, PageLoader, ErrorState } from '@shared/components/feedback';
import {
  Badge,
  Card,
  CardContent,
  Icon,
  IconButton,
  SectionHeader,
  buttonVariants,
} from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ios';
import { AuctionRail } from '@shared/components/cards';
import { useCountdown, useLocale, useMoney, useToast } from '@shared/hooks';
import {
  formatDateTime,
  formatDuration,
  getAuctionStatusLabelKey,
  getErrorCode,
  getErrorStatus,
  getAuctionStatusTone,
  getImageTintStyle,
  pickLocalizedName,
  resolveAssetUrl,
  shareLink,
} from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useAuction } from '../hooks/useAuction';
import { useAuctionBids } from '../hooks/useAuctionBids';
import { useSimilarAuctions } from '../hooks/useSimilarAuctions';
import { BidHistoryList } from '../components/BidHistoryList';
import { DetailGallery } from '../components/DetailGallery';
import type { Auction } from '../types/catalog.types';

type DetailTab = 'details' | 'bids' | 'seller';

export interface AuctionDetailPageProps {
  id: string;
  /**
   * The bid panel, given the auction's seller (a seller can't bid on their own auction) and status
   * (a closed auction may have been won by the viewer).
   */
  renderBiddingPanel?: (auction: { sellerId: string; status: string }) => ReactNode;
  watchlistToggle?: ReactNode;
  renderSellerFollowToggle?: (sellerId: string) => ReactNode;
}

export function AuctionDetailPage({
  id,
  renderBiddingPanel,
  watchlistToggle,
  renderSellerFollowToggle,
}: AuctionDetailPageProps) {
  const { t, isReady } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const { money, number } = useMoney();
  const [tab, setTab] = useState<DetailTab>('details');

  const auction = useAuction(id);
  const bids = useAuctionBids(id, auction.data?.status === 'LIVE');
  const similar = useSimilarAuctions(id);
  // Ticks every second on the shared interval, anchored to the server clock (ADR-013).
  const endsInMs = useCountdown(auction.data?.endsAt);
  const startsInMs = useCountdown(
    auction.data?.status === 'SCHEDULED' ? auction.data.startsAt : undefined,
  );

  if (!isReady || auction.isPending) return <PageLoader />;
  if (auction.isError || !auction.data) {
    // A definite 404 won't change on retry: offer a way on instead. Retry stays for network and
    // server failures, which can.
    const isNotFound =
      getErrorCode(auction.error) === 'AUCTION_NOT_FOUND' || getErrorStatus(auction.error) === 404;
    if (isNotFound) {
      return (
        <EmptyState
          icon="search"
          title={t('detail.notFound')}
          message={t('detail.notFoundMessage')}
          action={
            <Link
              href={ROUTES.auctions}
              className={`mt-2 ${buttonVariants({ variant: 'tinted' })}`}
            >
              {t('detail.browseAuctions')}
            </Link>
          }
        />
      );
    }
    return <ErrorState message={t('detail.loadError')} onRetry={() => void auction.refetch()} />;
  }

  const data = auction.data;
  const name = pickLocalizedName(data.product, locale);
  const coverImage = resolveAssetUrl(data.product.coverImage);
  const price = data.currentPrice ?? data.startingPrice;
  const tone = getAuctionStatusTone(data.status, endsInMs);
  const isLive = data.status === 'LIVE';
  const isOver = data.status === 'ENDED' || data.status === 'SOLD' || data.status === 'UNSOLD';
  const photos = data.product.imageUrls.length > 0 ? data.product.imageUrls : [];

  return (
    // Clears the pinned bottom action bar the bidding panel renders.
    <div className="pb-28">
      {/* Image well — full-bleed pastel tint with the glass controls floating over it. */}
      <div
        className="relative h-52 w-full"
        style={coverImage ? undefined : getImageTintStyle(data.product.id)}
      >
        {photos.length > 0 ? (
          <DetailGallery images={photos} name={name} />
        ) : coverImage ? (
          <Image src={coverImage} alt={name} fill sizes="100vw" className="object-cover" priority />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-foreground/22">
            <Icon name="package" size={92} />
          </span>
        )}

        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <BackButton label={tCommon('nav.back')} />
          <div className="flex items-center gap-2">
            <ShareButton
              label={t('detail.share')}
              copiedMessage={t('detail.linkCopied')}
              failedMessage={t('detail.shareUnavailable')}
            />
            {watchlistToggle}
          </div>
        </div>
      </div>

      {/* Content sheet — lifted over the image well with 28pt top corners. */}
      <div className="relative -mt-6 rounded-t-[28px] bg-background px-gutter pt-5">
        <div className="flex items-center gap-2">
          <Badge tone={tone} hasDot={tone === 'live'}>
            {tCommon(getAuctionStatusLabelKey(data.status, endsInMs))}
          </Badge>
          {isLive && endsInMs > 0 ? (
            <span className="inline-flex items-center gap-1 text-footnote text-muted-foreground tabular-nums">
              <Icon name="clock" size={14} />
              {formatDuration(endsInMs, locale)}
            </span>
          ) : null}
          {data.status === 'SCHEDULED' && startsInMs > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-footnote text-muted-foreground tabular-nums"
              data-testid="detail-starts-in"
            >
              <Icon name="clock" size={14} />
              {t('detail.startsIn')} {formatDuration(startsInMs, locale)}
            </span>
          ) : null}
          {isOver ? (
            <span className="text-footnote text-muted-foreground" data-testid="detail-ended-at">
              {t('detail.endedAt', { time: formatDateTime(data.endsAt, locale) })}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-title-2 font-extrabold text-foreground">{name}</h1>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">
              {!data.currentPrice
                ? t('detail.startingPrice')
                : data.status === 'SOLD'
                  ? t('detail.soldFor')
                  : t('detail.currentBid')}
            </p>
            {/* Prices are bold near-black, never the accent. */}
            <p className="text-large-title font-extrabold text-foreground tabular-nums">
              {money(price)}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-footnote text-muted-foreground">
            <Icon name="gavel" size={16} />
            {t('detail.bids', { count: data.bidCount, formattedCount: number(data.bidCount) })}
          </span>
        </div>

        {renderBiddingPanel ? (
          <div className="mt-4">
            {renderBiddingPanel({ sellerId: data.seller.id, status: data.status })}
          </div>
        ) : null}

        <SegmentedControl
          className="mt-5"
          label={t('detail.title')}
          value={tab}
          onChange={setTab}
          segments={[
            { id: 'details', label: t('detail.tabs.details') },
            { id: 'bids', label: t('detail.tabs.bids') },
            { id: 'seller', label: t('detail.tabs.seller') },
          ]}
        />

        <Card className="mt-3">
          <CardContent className="flex flex-col gap-3 text-subhead">
            {tab === 'details' ? (
              <AuctionFacts auction={data} />
            ) : tab === 'bids' ? (
              bids.data ? (
                <BidHistoryList bids={bids.data} />
              ) : (
                <PageLoader />
              )
            ) : (
              <>
                <DetailRow
                  label={t('detail.seller')}
                  value={
                    <span className="flex items-center gap-2">
                      <Link
                        href={ROUTES.sellerProfile(data.seller.id)}
                        className="font-semibold text-primary-text"
                      >
                        {data.seller.fullName}
                      </Link>
                      {renderSellerFollowToggle?.(data.seller.id)}
                    </span>
                  }
                />
                {/* Verified only when the seller is; a rating only once there are reviews. */}
                {data.seller.isVerified ? (
                  <div>
                    <Badge tone="live">{t('detail.verifiedSeller')}</Badge>
                  </div>
                ) : null}
                {data.sellerRating &&
                data.sellerRating.count > 0 &&
                data.sellerRating.average != null ? (
                  <DetailRow
                    label={t('detail.rating')}
                    value={t('detail.ratingValue', {
                      average: data.sellerRating.average.toLocaleString(
                        locale === 'ar' ? 'ar' : 'en-US',
                      ),
                      count: data.sellerRating.count,
                    })}
                  />
                ) : null}
                <DetailRow
                  label={t('detail.store')}
                  value={
                    <Link
                      href={ROUTES.store(data.store.id)}
                      className="font-semibold text-primary-text"
                    >
                      {pickLocalizedName(data.store, locale)}
                    </Link>
                  }
                />
                <DetailRow label={t('detail.city')} value={data.store.city} />
              </>
            )}
          </CardContent>
        </Card>

        {similar.data && similar.data.length > 0 ? (
          <section className="mt-6">
            <SectionHeader title={t('detail.similar')} />
            <AuctionRail auctions={similar.data} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** The description in the reading language; the API fills an empty one from the other. */
function localizedDescription(auction: Auction, locale: 'en' | 'ar'): string {
  const { descriptionAr, descriptionEn } = auction.product;
  const text = locale === 'ar' ? descriptionAr || descriptionEn : descriptionEn || descriptionAr;
  return text?.trim() ?? '';
}

/**
 * Everything a buyer checks before bidding: description, condition (explained), category, when
 * it starts and ends (and how much late bids extended it), delivery fee, how to pay (chosen at
 * checkout, not when bidding), and returns. Never the seller's phone, street or location.
 */
function AuctionFacts({ auction }: { auction: Auction }) {
  const { t } = useCatalogTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const description = localizedDescription(auction, locale);
  const extendedMinutes = Math.round(
    (new Date(auction.endsAt).getTime() - new Date(auction.originalEndsAt).getTime()) / 60_000,
  );
  const acceptsCard = auction.paymentMethods?.includes('CARD') ?? false;
  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">{t('detail.description')}</span>
        <p
          className="whitespace-pre-wrap text-body text-foreground"
          data-testid="detail-description"
        >
          {description || t('detail.noDescription')}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <DetailRow
          label={t('detail.condition')}
          value={t(`condition.${auction.product.condition}`)}
        />
        <span className="text-footnote text-muted-foreground">
          {t(`conditionHint.${auction.product.condition}`)}
        </span>
      </div>
      {auction.product.category ? (
        <DetailRow
          label={t('detail.category')}
          value={pickLocalizedName(auction.product.category, locale)}
        />
      ) : null}
      <DetailRow label={t('detail.starts')} value={formatDateTime(auction.startsAt, locale)} />
      <DetailRow label={t('detail.ends')} value={formatDateTime(auction.endsAt, locale)} />
      {extendedMinutes > 0 ? (
        <span className="text-footnote text-muted-foreground" data-testid="detail-extended">
          {t('detail.extended', { count: extendedMinutes })}
        </span>
      ) : null}
      <DetailRow label={t('detail.deliveryFee')} value={money(auction.store.deliveryFee)} />
      <div className="flex flex-col gap-1">
        <DetailRow
          label={t('detail.payment')}
          value={t(acceptsCard ? 'detail.paymentCodOrCard' : 'detail.paymentCod')}
        />
        <span className="text-footnote text-muted-foreground">{t('detail.paymentHint')}</span>
      </div>
      <div className="flex flex-col gap-1">
        <DetailRow
          label={t('detail.returns')}
          value={t('detail.returnsValue', { count: auction.returnWindowDays ?? 7 })}
        />
        <span className="text-footnote text-muted-foreground">{t('detail.returnsHint')}</span>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function BackButton({ label }: { label: string }) {
  return (
    <IconButton
      name="chevron-left"
      className="rtl:[&>svg]:-scale-x-100"
      label={label}
      tone="glass"
      onClick={() => window.history.back()}
    />
  );
}

function ShareButton({
  label,
  copiedMessage,
  failedMessage,
}: {
  label: string;
  copiedMessage: string;
  failedMessage: string;
}) {
  const toast = useToast();
  const handleShare = async () => {
    const outcome = await shareLink(window.location.href);
    if (outcome === 'copied') toast.success(copiedMessage);
    if (outcome === 'unavailable') toast.error(failedMessage);
  };

  return (
    <IconButton name="share-2" label={label} tone="glass" onClick={() => void handleShare()} />
  );
}
