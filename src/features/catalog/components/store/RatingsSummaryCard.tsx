'use client';

import { useTranslation } from 'react-i18next';
import { Card, Icon, StarRow } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { reviewTagKey } from '../../lib/review-tags';
import type { StoreReviewSummary } from '../../types/store.types';

/**
 * The ratings at a glance (design `.rsum`): the score, how it splits across 5 to 1 stars, the
 * tags buyers pick most, and, said once for every review below, that each comes from a delivered
 * order.
 */
export function RatingsSummaryCard({ summary }: { summary: StoreReviewSummary }) {
  const { t } = useCatalogTranslation();
  const { t: tCommon } = useTranslation('common');
  const { number, rating } = useMoney();
  const average = summary.avg ?? 0;
  const tags = summary.topTags.filter((tag) => reviewTagKey(tag.tag)).slice(0, 3);

  return (
    <Card isInset className="grid gap-4 lg:sticky lg:top-24">
      <div className="flex items-center gap-5">
        <div className="grid flex-none justify-items-center gap-1.5 text-center">
          <b className="font-num text-[46px] leading-none font-medium text-foreground">
            {rating(average)}
          </b>
          <StarRow
            value={Math.round(average)}
            size={14}
            label={t('store.ratings.outOf', { value: rating(average) })}
          />
          <span className="text-xs text-muted-foreground">
            {number(summary.count)} {tCommon('rating.count', { count: summary.count })}
          </span>
        </div>
        <ul className="grid min-w-0 flex-1 gap-[7px]">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars - 1] ?? 0;
            const share = summary.count > 0 ? (count / summary.count) * 100 : 0;
            return (
              <li
                key={stars}
                aria-label={t('store.ratings.starsRow', { stars, count })}
                className="flex items-center gap-[7px] text-[12.5px] text-foreground-soft"
              >
                <span aria-hidden className="flex items-center gap-[7px]">
                  <span className="font-num">{number(stars)}</span>
                  <Icon name="star" isFilled size={12} className="text-gold" />
                </span>
                <span
                  aria-hidden
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high"
                >
                  <span
                    className="block h-full rounded-full bg-grad"
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span aria-hidden className="min-w-[22px] text-end font-num">
                  {number(count)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {tags.length > 0 ? (
        <ul aria-label={t('store.ratings.topTags')} className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.tag}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface-raised px-[11px] text-xs text-foreground-soft"
            >
              {t(reviewTagKey(tag.tag) ?? '')}
              <b className="font-num font-semibold text-foreground">{number(tag.count)}</b>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="flex gap-2 text-[12.5px] leading-[1.6] text-foreground-soft">
        <Icon name="seal-check" isFilled size={16} className="mt-[3px] text-gold" />
        <span>{t('store.ratings.rule')}</span>
      </p>
    </Card>
  );
}
