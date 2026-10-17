'use client';

import { Avatar, Icon, StarRow } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { reviewTagKey } from '../../lib/review-tags';
import type { StoreReview } from '../../types/store.types';

/** One rating (design `.rev`): who, when, the stars, what they said, the item, the store's reply. */
export function ReviewCard({ review }: { review: StoreReview }) {
  const { t } = useCatalogTranslation();
  const { locale } = useLocale();
  const { number } = useMoney();
  const tags = review.tags.flatMap((tag) => {
    const key = reviewTagKey(tag);
    return key ? [{ tag, label: t(key) }] : [];
  });

  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-[18px]">
      <header className="flex items-center gap-3">
        <Avatar name={review.authorName} size="sm" />
        <span className="grid min-w-0 flex-1 gap-0.5">
          <b className="truncate text-[14.5px] font-medium text-foreground">{review.authorName}</b>
          <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
            {formatDate(review.createdAt, locale)}
          </time>
        </span>
        <StarRow
          value={review.rating}
          size={14}
          label={t('store.ratings.outOf', { value: number(review.rating) })}
        />
      </header>

      {review.comment ? (
        <p className="text-[15px] leading-[1.7] text-foreground-soft">{review.comment}</p>
      ) : null}

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.tag}
              className="inline-flex h-7 items-center rounded-full border border-border bg-surface-raised px-[11px] text-xs text-foreground-soft"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      ) : null}

      {review.itemName ? (
        <p className="flex min-w-0 items-center gap-2.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-xl border bg-tile"
          >
            <Icon name="bag" tone="gold" size={20} />
          </span>
          <span className="truncate">{t('store.ratings.item', { name: review.itemName })}</span>
        </p>
      ) : null}

      {review.reply ? (
        <div className="grid gap-1 border-s-2 border-gold-line ps-3">
          <b className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gold light:text-gold-lo">
            <Icon name="storefront" size={15} />
            {t('store.ratings.reply')}
          </b>
          <p className="text-[13.5px] leading-[1.6] text-foreground-soft">{review.reply.text}</p>
        </div>
      ) : null}
    </article>
  );
}
