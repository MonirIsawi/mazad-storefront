'use client';

import type { ReactNode } from 'react';
import { Price } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { StoreFront } from '../../types/store.types';

interface Stat {
  key: string;
  value: ReactNode;
  label: string;
  isGold?: boolean;
}

/**
 * The store's numbers (design `.stats`): live auctions, followers, sales, and the delivery fee,
 * which is per store so it is shown up front. Each number appears only when the API gives it;
 * the live count falls back to the live tab's own total.
 */
export function StoreStats({ store, liveTotal }: { store: StoreFront; liveTotal?: number }) {
  const { t } = useCatalogTranslation();
  const { number } = useMoney();
  const live = store.liveCount ?? liveTotal;

  const stats: Stat[] = [];
  if (live != null) stats.push({ key: 'live', value: number(live), label: t('store.stats.live') });
  if (store.followers != null) {
    stats.push({
      key: 'followers',
      value: number(store.followers),
      label: t('store.stats.followers'),
    });
  }
  if (store.soldCount != null) {
    stats.push({ key: 'sold', value: number(store.soldCount), label: t('store.stats.sold') });
  }
  stats.push({
    key: 'deliveryFee',
    value: <Price value={store.deliveryFee} size="lg" tone="gold" className="text-[26px]" />,
    label: t('store.stats.deliveryFee'),
    isGold: true,
  });

  return (
    <dl
      className={cn(
        'grid gap-2.5 lg:grid-cols-4',
        stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="flex min-w-0 flex-col-reverse gap-0.5 rounded-[22px] border border-border bg-surface p-3.5"
        >
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd
            className={cn(
              'truncate font-num text-[26px] leading-[1.1] font-light',
              stat.isGold ? 'text-gold' : 'text-foreground',
            )}
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
