'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, PageLoader, ErrorState } from '@shared/components/feedback';
import { Breadcrumbs, PageContainer } from '@shared/components/layout';
import { AuctionCard, Rail } from '@shared/components/cards';
import { Icon, buttonVariants } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { getErrorCode, getErrorStatus, pickLocalizedName } from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';
import { useAuction } from '../hooks/useAuction';
import { useAuctionBids } from '../hooks/useAuctionBids';
import { useSimilarAuctions } from '../hooks/useSimilarAuctions';
import { AboutItemCard, productSpecs } from '../components/auction/AboutItemCard';
import { AuctionGallery } from '../components/auction/AuctionGallery';
import { BidHistoryCard } from '../components/auction/BidHistoryCard';
import { DeliveryPaymentCard } from '../components/auction/DeliveryPaymentCard';
import { GalleryTools } from '../components/auction/GalleryTools';
import { PriceBox } from '../components/auction/PriceBox';
import { RulesCard } from '../components/auction/RulesCard';
import { SellerCard } from '../components/auction/SellerCard';

export interface AuctionDetailPageProps {
  id: string;
  /**
   * The viewer's standing and what they can do (the bidding feature): the state banner, the bid
   * panel and the phone bid bar. Given the seller (a seller can't bid on their own auction) and
   * the status (a closed auction may have been won by the viewer).
   */
  renderBiddingPanel?: (auction: { sellerId: string; status: string }) => ReactNode;
  watchlistToggle?: ReactNode;
  renderSellerFollowToggle?: (sellerId: string) => ReactNode;
  /** The viewer was outbid: the clock turns amber with the banner. */
  isOutbid?: boolean;
}

/**
 * The auction page (design `auction`): price and time first, the viewer's standing second, then
 * everything that earns trust: the item, the seller, delivery and payment, the bids and the
 * rules. Phones stack it under a full-width gallery with the bid bar pinned; from 960px the bid
 * panel stays beside the gallery while the details scroll.
 */
export function AuctionDetailPage({
  id,
  renderBiddingPanel,
  watchlistToggle,
  renderSellerFollowToggle,
  isOutbid = false,
}: AuctionDetailPageProps) {
  const { t, isReady } = useCatalogTranslation();
  const { locale } = useLocale();
  const auction = useAuction(id);
  const bids = useAuctionBids(id, auction.data?.status === 'LIVE');
  const similar = useSimilarAuctions(id);

  if (!isReady || auction.isPending) return <PageLoader />;
  if (auction.isError || !auction.data) {
    // A definite 404 won't change on retry: offer a way on instead. Retry stays for network and
    // server failures, which can.
    const isNotFound =
      getErrorCode(auction.error) === 'AUCTION_NOT_FOUND' || getErrorStatus(auction.error) === 404;
    if (isNotFound) {
      return (
        <EmptyState
          icon="search-minus"
          title={t('detail.notFound')}
          message={t('detail.notFoundMessage')}
          titleAs="h1"
          action={
            <Link href={ROUTES.auctions} className={`mt-2 ${buttonVariants({ variant: 'gold' })}`}>
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
  const storeName = pickLocalizedName(data.store, locale);
  const category = data.product.category?.parent ?? data.product.category;
  const callouts = productSpecs(data, locale).map((spec) => `${spec.name} ${spec.value}`);

  return (
    <PageContainer className="pb-36 lg:pb-16">
      <Breadcrumbs
        className="hidden lg:block"
        items={[
          { label: t('crumbs.home'), href: ROUTES.home },
          ...(category
            ? [
                {
                  label: pickLocalizedName(category, locale),
                  href: `${ROUTES.auctions}?categoryId=${category.id}`,
                },
              ]
            : []),
          { label: name },
        ]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-x-11 lg:gap-y-[22px] lg:pt-1">
        <div className="lg:col-start-1 lg:row-start-1">
          <AuctionGallery
            images={data.product.gallery}
            name={name}
            callouts={callouts}
            tools={<GalleryTools watchlistToggle={watchlistToggle} />}
          />
        </div>

        <div className="grid gap-4 lg:sticky lg:top-[100px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="grid gap-2">
            <span className="flex items-center gap-2 text-[13px] text-foreground-soft">
              <Icon name="store" size={16} />
              {storeName} · {data.store.city}
            </span>
            <h1 className="text-[26px] leading-[1.3] font-medium text-foreground">{name}</h1>
          </div>
          <PriceBox auction={data} isUrgent={isOutbid} />
          {renderBiddingPanel?.({ sellerId: data.seller.id, status: data.status })}
        </div>

        <div className="grid gap-[18px] lg:col-start-1 lg:row-start-2">
          <AboutItemCard auction={data} />
          <SellerCard auction={data} followToggle={renderSellerFollowToggle?.(data.seller.id)} />
          <DeliveryPaymentCard auction={data} />
          <BidHistoryCard
            auctionId={data.id}
            bids={bids.data}
            isUpcoming={data.status === 'SCHEDULED'}
          />
          <RulesCard auction={data} />
        </div>
      </div>

      {similar.data && similar.data.length > 0 ? (
        <Rail title={t('detail.similar')} className="mt-8 lg:mt-12">
          {similar.data.map((item) => (
            <AuctionCard key={item.id} auction={item} />
          ))}
        </Rail>
      ) : null}
    </PageContainer>
  );
}
