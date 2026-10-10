'use client';

import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Icon } from '@shared/components/ui';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDateTime, getErrorCode, pickLocalizedName } from '@shared/lib';
import {
  canCancelAuction,
  canEditAuction,
  canRelistAuction,
  canSubmitAuction,
  getSellerAuctionTone,
} from '../lib/auction-permissions';
import { useCancelAuction, useSubmitAuction } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import type { SellerAuction } from '../types/selling.types';

export interface SellerAuctionCardProps {
  auction: SellerAuction;
  onEdit: (auction: SellerAuction) => void;
  /** "List again", pre-filled from this listing. */
  onRelist?: (auction: SellerAuction) => void;
}

/** One row of "My listings": status, the money, and only the actions this state actually allows. */
export function SellerAuctionCard({ auction, onEdit, onRelist }: SellerAuctionCardProps) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const { money, number } = useMoney();
  const submitAuction = useSubmitAuction();
  const cancelAuction = useCancelAuction();

  const isMutating =
    (submitAuction.isPending && submitAuction.variables === auction.id) ||
    (cancelAuction.isPending && cancelAuction.variables?.id === auction.id);
  const errorCode = getErrorCode(submitAuction.error) ?? getErrorCode(cancelAuction.error);

  const name = auction.product ? pickLocalizedName(auction.product, locale) : auction.id;

  return (
    <Card isInset className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 truncate text-headline font-semibold text-foreground">
          {name}
        </p>
        <Badge tone={getSellerAuctionTone(auction.status)} className="shrink-0">
          {t(`status.${auction.status}`)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-footnote text-muted-foreground">
        <span className="text-callout font-bold text-foreground tabular-nums">
          {money(auction.currentPrice ?? auction.startingPrice)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon name="gavel" size={12} />
          {t('auctions.bids', { count: auction.bidCount })}
        </span>
      </div>

      <p className="text-caption text-muted-foreground tabular-nums">
        {t('auctions.endsAt', { date: formatDateTime(auction.endsAt, locale) })}
      </p>

      {/* The admin's reason is the only way a seller learns what to fix before resubmitting. */}
      {auction.status === 'REJECTED' && auction.rejectionReason ? (
        <p className="text-footnote text-warning">
          {t('auctions.rejectedReason', { reason: auction.rejectionReason })}
        </p>
      ) : null}
      {auction.status === 'CANCELLED' && auction.cancelReason ? (
        <p className="text-footnote text-muted-foreground">
          {t('auctions.cancelledReason', { reason: auction.cancelReason })}
        </p>
      ) : null}

      {errorCode ? (
        <p role="alert" className="text-footnote text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canEditAuction(auction.status) ? (
          <Button size="sm" variant="outline" onClick={() => onEdit(auction)}>
            {t('auctions.edit')}
          </Button>
        ) : null}

        {canSubmitAuction(auction.status) ? (
          <Button size="sm" isLoading={isMutating} onClick={() => submitAuction.mutate(auction.id)}>
            {t('auctions.publish')}
          </Button>
        ) : null}

        {onRelist && canRelistAuction(auction) ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRelist(auction)}
            data-testid="auction-relist"
          >
            {t('auctions.relist')}
          </Button>
        ) : null}

        {canCancelAuction(auction) ? (
          <Button
            size="sm"
            variant="destructive"
            isLoading={isMutating}
            onClick={() => {
              if (window.confirm(t('auctions.cancelConfirm'))) {
                cancelAuction.mutate({ id: auction.id });
              }
            }}
          >
            {t('auctions.cancel')}
          </Button>
        ) : null}

        {/* A live listing that has taken bids is locked: say why rather than showing nothing. */}
        {auction.status === 'LIVE' && auction.bidCount > 0 ? (
          <p className="self-center text-caption text-muted-foreground">
            {t('auctions.lockedWithBids', { count: number(auction.bidCount) })}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
