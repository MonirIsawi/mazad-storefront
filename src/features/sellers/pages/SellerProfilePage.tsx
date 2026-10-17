'use client';

import type { ReactNode } from 'react';
import { PageLoader, ErrorState } from '@shared/components/feedback';
import { PageContainer } from '@shared/components/layout';
import { Avatar, Icon, RatingSummary, SectionHeader } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useSellerProfile } from '../hooks/useSellerProfile';
import { useSellersTranslation } from '../hooks/useSellersTranslation';
import { FollowSellerButton } from '../components/FollowSellerButton';
import { SellerStoreList } from '../components/SellerStoreList';
import { SellerTopBar } from '../components/SellerTopBar';

export interface SellerProfilePageProps {
  id: string;
  reviewsSlot?: ReactNode;
  /** The seller's live auctions under the given heading (composed in from the catalog). */
  renderAuctions?: (title: string) => ReactNode;
  /** The Follow control; the route hides it on the viewer's own profile. */
  renderFollowToggle?: (sellerId: string) => ReactNode;
  /** Wraps the rating so it opens the ratings tab of the seller's store, when that exists. */
  renderRating?: (storeId: string, rating: ReactNode) => ReactNode;
}

/** The person behind the stores (Bidoom design `seller`). */
export function SellerProfilePage({
  id,
  reviewsSlot,
  renderAuctions,
  renderFollowToggle,
  renderRating,
}: SellerProfilePageProps) {
  const { t, isReady } = useSellersTranslation();
  const { locale } = useLocale();
  const seller = useSellerProfile(id);

  if (!isReady || seller.isPending) return <PageLoader />;
  if (seller.isError || !seller.data) {
    return <ErrorState message={t('profile.notFound')} onRetry={() => void seller.refetch()} />;
  }

  const data = seller.data;
  const { average, count } = data.rating;
  // The rating opens the ratings of the seller's main store: the default one, else the first.
  const mainStore = data.stores.find((store) => store.isDefault) ?? data.stores[0];
  const summary =
    average != null && count > 0 ? <RatingSummary average={average} count={count} /> : null;
  const rating =
    summary && mainStore && renderRating ? renderRating(mainStore.id, summary) : summary;

  return (
    <>
      <SellerTopBar
        label={t('profile.title')}
        crumbs={[{ label: t('profile.crumbStores') }, { label: data.fullName }]}
      />
      <PageContainer className="grid max-w-[900px] gap-[18px] pb-8">
        <section className="grid justify-items-center gap-4 rounded-xl border border-border-strong bg-surface bg-[linear-gradient(180deg,rgb(226_180_103/5%),transparent_40%)] p-7 text-center">
          <Avatar name={data.fullName} size="lg" />
          <div className="grid gap-1">
            <h1 className="flex items-center justify-center gap-2 font-display text-[28px] leading-tight font-normal text-foreground">
              {data.fullName}
              {data.isVerified ? (
                <span className="inline-flex text-gold">
                  <Icon name="seal-check" isFilled size={22} label={t('profile.verified')} />
                </span>
              ) : null}
            </h1>
            <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[13px] text-foreground-soft">
              <span>
                {t('profile.memberSince', { date: formatDate(data.memberSince, locale) })}
              </span>
              <span aria-hidden>·</span>
              {rating ?? <span>{t('profile.noRating')}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {renderFollowToggle ? (
              renderFollowToggle(data.id)
            ) : (
              <FollowSellerButton sellerId={data.id} size="md" />
            )}
            <span className="inline-flex h-[38px] items-center gap-2 rounded-full border border-border bg-surface-raised px-4 text-sm text-foreground-soft">
              <Icon name="users" size={16} />
              {t('profile.followers', { count: data.followerCount })}
            </span>
          </div>
        </section>

        {data.stores.length > 0 ? (
          <section className="grid gap-3.5">
            <SectionHeader title={t('profile.stores')} />
            <SellerStoreList stores={data.stores} />
          </section>
        ) : null}

        {renderAuctions?.(t('profile.currentAuctions'))}
        {reviewsSlot}
      </PageContainer>
    </>
  );
}
