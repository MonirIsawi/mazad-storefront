'use client';

import { Card, CardTitle, KeyValueList, SeeAllLink, type KeyValueRow } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDateTime } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { Auction } from '../../types/catalog.types';

/**
 * Rules for this auction (design `.ladder`): the bid step from the API (the price tier's step, not a
 * seller's choice), the late-bid extension and how often it can happen, how bidders are named, and
 * that bids and wins bind. A rule the payload doesn't carry is left out rather than guessed.
 */
export function RulesCard({ auction }: { auction: Auction }) {
  const { t } = useCatalogTranslation();
  const { money } = useMoney();
  const { locale } = useLocale();
  const step = auction.bidIncrement ?? auction.minIncrement;
  const minutes = auction.antiSnipingMinutes;
  const strong = 'font-semibold text-foreground';

  const rows: KeyValueRow[] = [
    { key: 'starts', label: t('detail.starts'), value: formatDateTime(auction.startsAt, locale) },
    { key: 'ends', label: t('detail.ends'), value: formatDateTime(auction.endsAt, locale) },
    // Once bids replaced it as the price shown, the opening price stays readable here.
    ...(auction.currentPrice != null
      ? [{ key: 'opening', label: t('price.opening'), value: money(auction.startingPrice) }]
      : []),
    { key: 'step', label: t('rules.step'), value: <b className={strong}>{money(step)}</b> },
    ...(minutes
      ? [
          {
            key: 'late',
            label: t('rules.lateBid', { count: minutes }),
            value: <b className={strong}>{t('rules.adds', { count: minutes })}</b>,
          },
        ]
      : []),
    ...(auction.maxExtensions != null
      ? [
          {
            key: 'max',
            label: t('rules.maxExtensions'),
            value: <b className={strong}>{t('rules.times', { count: auction.maxExtensions })}</b>,
          },
        ]
      : []),
    {
      key: 'names',
      label: t('rules.names'),
      value: <b className={strong}>{t('rules.namesValue')}</b>,
    },
    {
      key: 'binding',
      label: t('rules.binding'),
      value: <b className={strong}>{t('rules.bindingValue')}</b>,
    },
  ];

  return (
    <Card data-testid="detail-rules">
      <CardTitle>{t('rules.title')}</CardTitle>
      <div className="grid gap-2 px-[18px] pt-1 pb-[18px]">
        <KeyValueList rows={rows} />
        <p className="text-xs leading-[1.6] text-muted-foreground">{t('rules.stepNote')}</p>
        <SeeAllLink
          href={ROUTES.helpTopic('how-auctions-work')}
          className="justify-self-start py-2"
        >
          {t('rules.how')}
        </SeeAllLink>
      </div>
    </Card>
  );
}
