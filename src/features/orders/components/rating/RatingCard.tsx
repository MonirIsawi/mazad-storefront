'use client';

import { useState } from 'react';
import { Button, Card, Icon, InitialTile, StarRow } from '@shared/components/ui';
import { useLocale, useServerClock } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { orderStoreName } from '../../lib/order-display';
import { rateableItem } from '../../lib/review-rules';
import type { Order } from '../../types/orders.types';
import { RateSheet } from './RateSheet';

/**
 * The delivered order's rating card (design `order-done`): five tappable stars that open the
 * rating sheet with that many chosen, or, once rated, the stars with an edit while the window is
 * open. Hidden when the API has no ratings (no `canReview` on the items) or nothing can be rated.
 */
export function RatingCard({ order }: { order: Order }) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const { now } = useServerClock();
  const [openWith, setOpenWith] = useState<number | null>(null);
  const item = rateableItem(order.items);
  if (!item || order.status !== 'DELIVERED') return null;

  const store = orderStoreName(order, locale);
  const review = item.review ?? null;
  const editableUntil = review?.editableUntil ?? item.reviewWindowEndsAt ?? null;
  const canEdit = Boolean(review && editableUntil && Date.parse(editableUntil) > now());
  const canReturn = !item.returnRequest;

  return (
    <Card isInset tone={review ? 'plain' : 'gold'} className="grid gap-4" data-testid="rating-card">
      <div className="flex items-center gap-3">
        <InitialTile name={store} size={48} />
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 className="font-medium text-foreground">
            {review ? t('rating.done') : t('rating.cardTitle', { store })}
          </h2>
          {review ? (
            <StarRow value={review.rating} label={t('rating.star', { count: review.rating })} />
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('rating.cardHint')}
              {editableUntil
                ? ` ${t('rating.openUntil', { date: formatDate(editableUntil, locale) })}`
                : null}
            </p>
          )}
        </div>
        {canEdit && review ? (
          <Button variant="plain" size="sm" onClick={() => setOpenWith(review.rating)}>
            <Icon name="pencil" size={16} />
            {t('rating.edit')}
          </Button>
        ) : null}
      </div>
      {review ? null : (
        <div role="group" aria-label={t('rating.starsLabel')} className="flex gap-2">
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              type="button"
              aria-label={t('rating.star', { count: stars })}
              onClick={() => setOpenWith(stars)}
              className="grid h-[54px] flex-1 place-items-center rounded-2xl border border-border bg-surface-raised text-muted-foreground transition-colors duration-fast hover:border-gold-line hover:bg-gold-soft hover:text-gold"
            >
              <Icon name="star" size={26} />
            </button>
          ))}
        </div>
      )}
      {openWith != null ? (
        <RateSheet
          order={order}
          item={item}
          store={store}
          initialStars={openWith}
          canReturn={canReturn}
          editableUntil={editableUntil}
          onClose={() => setOpenWith(null)}
        />
      ) : null}
    </Card>
  );
}
