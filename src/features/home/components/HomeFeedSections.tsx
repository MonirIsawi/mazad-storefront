'use client';

import { ROUTES } from '@shared/constants';
import { EmptyState } from '@shared/components/feedback';
import { AuctionCard, AuctionGrid, Rail } from '@shared/components/cards';
import { SectionHeader, SeeAllLink } from '@shared/components/ui';
import { useHomeTranslation } from '../hooks/useHomeTranslation';
import type { HomeAuction } from '../types/home.types';

/** Phones: the lots ending within the hour, as a rail; absent when nothing ends that soon. */
export function FinalHourRail({ auctions }: { auctions: HomeAuction[] }) {
  const { t } = useHomeTranslation();
  if (auctions.length === 0) return null;
  return (
    <Rail
      className="lg:hidden"
      title={t('sections.finalHour')}
      icon="hourglass"
      seeAll={{ href: `${ROUTES.auctions}?status=live&endingSoon=true`, label: t('viewAll') }}
    >
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </Rail>
  );
}

/** Live now: two rows of the grid (four lots on phones, eight from 960px). */
export function LiveNowSection({
  auctions,
  hasFeatured = false,
}: {
  auctions: HomeAuction[];
  /** The one live lot is already the featured card: no "nothing live" message under it. */
  hasFeatured?: boolean;
}) {
  const { t } = useHomeTranslation();
  if (auctions.length === 0 && hasFeatured) return null;
  return (
    <section className="grid gap-3.5">
      <SectionHeader
        title={t('sections.live')}
        icon="live"
        action={<SeeAllLink href={`${ROUTES.auctions}?status=live`}>{t('viewAll')}</SeeAllLink>}
      />
      {auctions.length === 0 ? (
        <EmptyState message={t('empty.live')} icon="gavel" className="py-6 lg:py-10" />
      ) : (
        <AuctionGrid
          auctions={auctions.slice(0, 8)}
          priorityCount={2}
          className="[&>li:nth-child(n+5)]:hidden lg:[&>li:nth-child(n+5)]:block"
        />
      )}
    </section>
  );
}

/** Starting soon: the scheduled lots, counting down to their start. */
export function StartingSoonRail({ auctions }: { auctions: HomeAuction[] }) {
  const { t } = useHomeTranslation();
  if (auctions.length === 0) return null;
  return (
    <Rail
      title={t('sections.upcoming')}
      icon="calendar"
      seeAll={{ href: `${ROUTES.auctions}?status=upcoming`, label: t('viewAll') }}
    >
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </Rail>
  );
}
