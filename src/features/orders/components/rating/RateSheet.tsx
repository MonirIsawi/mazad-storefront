'use client';

import { useState } from 'react';
import { Button, Icon, Notice, Sheet, Textarea } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDate, getErrorCode } from '@shared/lib';
import { useSaveReview } from '../../hooks/useSaveReview';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { orderItemName } from '../../lib/order-display';
import { REVIEW_COMMENT_MAX_LENGTH, tagsInBand } from '../../lib/review-rules';
import type { Order } from '../../types/orders.types';
import { RateStars } from './RateStars';
import { RateTags } from './RateTags';

interface RateSheetProps {
  order: Order;
  item: Order['items'][number];
  store: string;
  initialStars: number;
  /** The item can still be returned: at two stars or fewer the sheet offers that first. */
  canReturn: boolean;
  editableUntil: string | null;
  onClose: () => void;
}

/**
 * The rating sheet (design `rate`): stars (required), quick tags that switch from praise to
 * problems at three stars or fewer (at most three), an optional comment, no photos. It publishes
 * under the buyer's full name with the item's name; a second open edits the same rating.
 */
export function RateSheet(props: RateSheetProps) {
  const { order, item, store, canReturn, editableUntil, onClose } = props;
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const review = item.review ?? null;
  const [stars, setStars] = useState(props.initialStars);
  const [tags, setTags] = useState<string[]>(() => tagsInBand(stars, review?.tags ?? []));
  const [comment, setComment] = useState(review?.comment ?? '');
  const save = useSaveReview(order.id);
  const error = getErrorCode(save.error);

  const changeStars = (next: number) => {
    setStars(next);
    setTags((current) => tagsInBand(next, current));
  };
  const submit = () =>
    save.mutate(
      {
        orderItemId: item.id,
        reviewId: review?.id,
        input: { rating: stars, tags, comment: comment.trim() || null },
      },
      { onSuccess: onClose },
    );

  return (
    <Sheet
      isOpen
      onClose={onClose}
      width="lg"
      title={t('rating.sheetTitle', { store })}
      description={
        <>
          {orderItemName(item, locale)} ·{' '}
          <span dir="ltr" className="font-tabular">
            {order.orderNumber}
          </span>
        </>
      }
      footer={
        <div className="grid gap-2.5">
          {error || save.isError ? (
            <p role="alert" className="text-[13px] text-destructive">
              {t(`rating.errors.${error ?? 'generic'}`, {
                defaultValue: t('rating.errors.generic'),
              })}
            </p>
          ) : null}
          <Button isFullWidth isLoading={save.isPending} onClick={submit} data-testid="rate-submit">
            {review ? t('rating.save') : t('rating.post')}
          </Button>
        </div>
      }
    >
      <RateStars value={stars} onChange={changeStars} />
      <RateTags stars={stars} value={tags} onChange={setTags} />
      {stars <= 2 && canReturn ? (
        <Notice icon="info">
          {t('rating.returnOffer')}{' '}
          <a
            href="#order-items"
            onClick={onClose}
            className="font-semibold underline underline-offset-2"
          >
            {t('rating.returnAction')}
          </a>
        </Notice>
      ) : null}
      <Textarea
        label={t('rating.comment')}
        placeholder={t('rating.commentPlaceholder')}
        rows={3}
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <p className="flex gap-2 text-[12.5px] leading-[1.6] text-foreground-soft">
        <Icon name="eye" size={16} className="mt-0.5 shrink-0 text-gold" />
        <span>
          {t('rating.rule')}
          {editableUntil
            ? ` ${t('rating.ruleUntil', { date: formatDate(editableUntil, locale) })}`
            : null}
        </span>
      </p>
    </Sheet>
  );
}
