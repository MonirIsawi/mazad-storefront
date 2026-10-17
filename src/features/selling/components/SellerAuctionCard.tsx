'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmDialog, Icon, buttonVariants } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useLocale } from '@shared/hooks';
import { getErrorCode, pickLocalizedName, resolveThumbUrl } from '@shared/lib';
import {
  canCancelAuction,
  canEditAuction,
  canRelistAuction,
  canSubmitAuction,
} from '../lib/auction-permissions';
import { SELLING_PATHS } from '../lib/selling-paths';
import { useCancelAuction, useSubmitAuction } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import type { SellerAuction } from '../types/selling.types';
import { LotRow } from './LotRow';
import { AuctionRowDetail } from './auctions/AuctionRowDetail';
import { SellerAuctionBadge } from './auctions/SellerAuctionBadge';

export interface SellerAuctionCardProps {
  auction: SellerAuction;
  /** Products that can be put up again; "List again" shows only for these (relistableProductIds). */
  relistable?: ReadonlySet<string>;
}

const SMALL_SOFT = buttonVariants({ variant: 'soft', size: 'sm' });
const SMALL_LINE = buttonVariants({ variant: 'line', size: 'sm' });

/** One row of "My auctions": status, the money, and only the actions this state allows. */
export function SellerAuctionCard({ auction, relistable }: SellerAuctionCardProps) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const submitAuction = useSubmitAuction();
  const cancelAuction = useCancelAuction();
  const [isAsking, setIsAsking] = useState(false);

  const cancelErrorCode = getErrorCode(cancelAuction.error);
  // A refused withdrawal: the review ended first (or an older API), not a refused cancellation.
  const errorCode =
    getErrorCode(submitAuction.error) ??
    (cancelErrorCode === 'AUCTION_NOT_CANCELLABLE' && cancelAuction.variables?.isWithdraw
      ? 'AUCTION_NOT_WITHDRAWABLE'
      : cancelErrorCode);

  const product = auction.product;
  const cover = product?.images?.find((image) => image.isCover) ?? product?.images?.[0];
  // Awaiting Bidoom's review: cancelling it is "withdrawing" it from the queue.
  const isWithdraw = auction.status === 'PENDING_APPROVAL';
  const isEditable = canEditAuction(auction.status);
  // Buyers can open it once it is on the marketplace; drafts and rejected ones open the editor.
  const href = isEditable
    ? SELLING_PATHS.auctionEdit(auction.id)
    : ['LIVE', 'SCHEDULED', 'ENDED', 'SOLD', 'UNSOLD'].includes(auction.status)
      ? ROUTES.auctionDetail(auction.id)
      : undefined;

  const actions = (
    <>
      {isEditable ? (
        <Link
          href={SELLING_PATHS.auctionEdit(auction.id)}
          className={auction.status === 'REJECTED' ? SMALL_LINE : SMALL_SOFT}
        >
          {auction.status === 'REJECTED' ? null : <Icon name="pencil-simple" size={16} />}
          {t(auction.status === 'REJECTED' ? 'auctions.fix' : 'auctions.edit')}
        </Link>
      ) : null}
      {canSubmitAuction(auction.status) && auction.status === 'DRAFT' ? (
        <Button
          size="sm"
          variant="line"
          isLoading={submitAuction.isPending}
          onClick={() => submitAuction.mutate(auction.id)}
        >
          {t('auctions.publish')}
        </Button>
      ) : null}
      {canRelistAuction(auction, relistable) ? (
        <Link
          href={SELLING_PATHS.auctionRelist(auction.id)}
          className={SMALL_LINE}
          data-testid="auction-relist"
        >
          {t('auctions.relist')}
        </Link>
      ) : null}
      {auction.status === 'SOLD' && !auction.saleCancelled ? (
        <Link href={ROUTES.sellingSales} className={SMALL_SOFT}>
          {t('auctions.order')}
        </Link>
      ) : null}
      {canCancelAuction(auction) ? (
        <Button
          size="sm"
          variant="soft"
          isLoading={cancelAuction.isPending}
          data-testid={isWithdraw ? 'auction-withdraw' : 'auction-cancel'}
          onClick={() => setIsAsking(true)}
        >
          {t(isWithdraw ? 'auctions.withdraw' : 'auctions.cancel')}
        </Button>
      ) : null}
    </>
  );

  return (
    <>
      <LotRow
        thumbUrl={resolveThumbUrl(cover?.url)}
        title={product ? pickLocalizedName(product, locale) : auction.id}
        href={href}
        hasActions
        end={actions}
      >
        <span className="flex flex-wrap items-center gap-2">
          <SellerAuctionBadge status={auction.status} />
        </span>
        <AuctionRowDetail auction={auction} />
        {/* A live listing that has taken bids is locked: say why rather than showing nothing. */}
        {auction.status === 'LIVE' && auction.bidCount > 0 ? (
          <span className="text-xs text-muted-foreground">{t('auctions.lockedWithBids')}</span>
        ) : null}
        {errorCode ? (
          <span role="alert" className="text-xs text-destructive">
            {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
          </span>
        ) : null}
      </LotRow>
      <ConfirmDialog
        isOpen={isAsking}
        tone="danger"
        title={t(isWithdraw ? 'auctions.withdrawTitle' : 'auctions.cancelTitle')}
        body={t(isWithdraw ? 'auctions.withdrawConfirm' : 'auctions.cancelConfirm')}
        confirmLabel={t(isWithdraw ? 'auctions.withdraw' : 'auctions.cancel')}
        cancelLabel={t('auctions.keep')}
        isPending={cancelAuction.isPending}
        onCancel={() => setIsAsking(false)}
        onConfirm={() =>
          cancelAuction.mutate(
            { id: auction.id, isWithdraw },
            { onSettled: () => setIsAsking(false) },
          )
        }
      />
    </>
  );
}
