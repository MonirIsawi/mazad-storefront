'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Badge, GoldTile, Icon, Price, type BadgeTone } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDate, pickLocalizedName } from '@shared/lib';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { Win } from '../types/wins.types';
import type { WinOrderSummary } from '../types/win-order';

const ORDER_TONE: Record<string, BadgeTone> = {
  CREATED: 'upcoming',
  CONFIRMED: 'gold',
  OUT_FOR_DELIVERY: 'ending',
  DELIVERED: 'live',
  CANCELLED: 'bad',
};

/**
 * A win with the order it created (design `.win-c`): the photo as bought, "Won for" in gold, the
 * date, then the order number and where the order is. The whole card opens the order.
 */
export function WinCard({ win, order }: { win: Win; order?: WinOrderSummary }) {
  const { t } = useWinsTranslation();
  const { locale } = useLocale();
  const name = pickLocalizedName(win.auction.product, locale);
  const orderId = win.orderItem?.orderId;
  const image = order?.imageByWin[win.id] ?? null;

  return (
    <Link
      href={orderId ? ROUTES.orderDetail(orderId) : ROUTES.auctionDetail(win.auctionId)}
      className="grid gap-3 rounded-xl border border-border bg-surface p-[18px] text-start transition-[border-color] duration-fast ease-ios hover:border-border-strong"
    >
      <span className="flex items-center gap-3">
        {image ? (
          <span className="relative size-16 shrink-0 overflow-hidden rounded-[18px]">
            <Image src={image} alt="" fill sizes="64px" className="object-cover" />
          </span>
        ) : (
          <GoldTile icon="trophy" size="lg" className="size-16" />
        )}
        <span className="grid min-w-0 flex-1 gap-[3px]">
          <span className="line-clamp-2 text-[14.5px] leading-[1.4] font-medium text-foreground">
            {name}
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">{t('card.wonFor')}</span>
            <Price value={win.amount} tone="gold" size="md" />
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(win.auction.endsAt, locale)}
          </span>
        </span>
      </span>
      <span className="flex items-center justify-between gap-2.5 border-t border-border pt-3 text-foreground-soft">
        <span className="inline-flex items-center gap-1.5 text-xs">
          <Icon name="package" size={16} />
          {orderId ? (
            <>
              {t('card.order')}{' '}
              <span dir="ltr" className="font-tabular">
                {order?.orderNumber ?? ''}
              </span>
            </>
          ) : (
            t('card.openAuction')
          )}
        </span>
        <span className="inline-flex items-center gap-2">
          {order ? (
            <Badge tone={ORDER_TONE[order.status] ?? 'done'}>
              {t(`orderStatus.${order.status}`)}
            </Badge>
          ) : (
            <Badge tone="done">{t(`status.${win.status}`)}</Badge>
          )}
          <Icon name="caret-left" size={16} className="ltr:-scale-x-100" />
        </span>
      </span>
    </Link>
  );
}
