'use client';

import { useMoney } from '@shared/hooks';
import { cn } from '@shared/lib';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';

export interface HubCounts {
  live?: number;
  pending?: number;
  rejected?: number;
  newOrders?: number;
}

/**
 * What needs the seller now (design `.stats.s4`): counts only, each from a real list, never an
 * invented figure. A count still loading is left out rather than shown as zero.
 */
export function HubStats({ counts }: { counts: HubCounts }) {
  const { t } = useSellingTranslation();
  const { number } = useMoney();
  const stats = (
    [
      ['live', counts.live],
      ['pending', counts.pending],
      ['rejected', counts.rejected],
      ['newOrders', counts.newOrders],
    ] as const
  ).filter((stat): stat is [(typeof stat)[0], number] => stat[1] != null);

  if (stats.length === 0) return null;
  return (
    <dl aria-label={t('hub.stats.label')} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {stats.map(([key, value]) => (
        <div
          key={key}
          className="flex flex-col-reverse gap-0.5 rounded-[22px] border border-border bg-surface p-3.5"
        >
          <dt className="text-xs text-muted-foreground">{t(`hub.stats.${key}`)}</dt>
          <dd
            className={cn(
              'font-num text-[26px] leading-[1.1] font-light',
              key === 'newOrders' && value > 0 ? 'text-gold' : 'text-foreground',
            )}
          >
            {number(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
