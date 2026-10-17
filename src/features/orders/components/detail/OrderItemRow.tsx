'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Icon, Input, Price } from '@shared/components/ui';
import { useLocale, useSubmitGuard } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import { useOpenReturn } from '../../hooks/useOrderMutations';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { orderItemImage, orderItemListingHref, orderItemName } from '../../lib/order-display';
import type { Order } from '../../types/orders.types';
import { OrderItemFacts } from '../OrderItemFacts';
import { OrderItemImage } from '../OrderItemImage';
import { SellerReturnPanel } from './SellerReturnPanel';

type Item = Order['items'][number];

/** One item as bought (the snapshot), with its return: the buyer opens one, the seller acts on it. */
export function OrderItemRow({
  orderId,
  item,
  isSeller,
  canReturn,
}: {
  orderId: string;
  item: Item;
  isSeller: boolean;
  canReturn: boolean;
}) {
  const { t } = useOrdersTranslation();
  const { locale } = useLocale();
  const name = orderItemName(item, locale);
  const listingHref = orderItemListingHref(item);

  return (
    <div
      className="grid gap-3 border-t border-border pt-3.5 first:border-t-0 first:pt-0"
      data-testid="order-item-row"
    >
      <div className="flex items-start gap-3">
        <OrderItemImage src={orderItemImage(item, 'full')} alt={name} sizePx={72} />
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 text-[14.5px] leading-[1.4] font-medium text-foreground">
              {name}
            </span>
            <Price
              value={item.display?.finalPrice ?? item.finalPrice}
              size="sm"
              className="shrink-0"
            />
          </div>
          <OrderItemFacts item={item} />
          {listingHref ? (
            <Link
              href={listingHref}
              className="justify-self-start text-[13px] font-semibold text-gold underline-offset-4 hover:underline light:text-gold-lo"
              data-testid="order-view-listing"
            >
              {t('detail.viewListing')}
            </Link>
          ) : null}
        </div>
      </div>
      {item.returnRequest ? (
        <>
          <p className="inline-flex items-center gap-1.5 text-[13px] text-foreground-soft">
            <Icon name="undo" size={15} />
            {t(`returnStatus.${item.returnRequest.status}`)}
          </p>
          {isSeller ? (
            <SellerReturnPanel
              orderId={orderId}
              returnRequest={item.returnRequest}
              refundAmount={item.finalPrice}
            />
          ) : null}
        </>
      ) : canReturn ? (
        <ReturnRequest orderId={orderId} itemId={item.id} />
      ) : null}
    </div>
  );
}

/** "Request a return": a reason, then one request (the API checks the 7-day window). */
function ReturnRequest({ orderId, itemId }: { orderId: string; itemId: string }) {
  const { t } = useOrdersTranslation();
  const openReturn = useOpenReturn(orderId);
  const guard = useSubmitGuard();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const error = getErrorCode(openReturn.error);

  if (!isOpen) {
    return (
      <Button
        variant="soft"
        size="sm"
        className="justify-self-start"
        onClick={() => setIsOpen(true)}
      >
        <Icon name="undo" size={16} />
        {t('actions.openReturn')}
      </Button>
    );
  }
  return (
    <div className="grid gap-2.5">
      <Input
        label={t('actions.returnReason')}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {t(`errors.${error}`, { defaultValue: t('errors.RETURN_WINDOW_CLOSED') })}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="line"
          disabled={!reason.trim()}
          isLoading={openReturn.isPending}
          onClick={() =>
            guard((release) =>
              openReturn.mutate(
                { orderItemId: itemId, reason: reason.trim() },
                { onSuccess: () => setIsOpen(false), onSettled: release },
              ),
            )
          }
        >
          {t('actions.returnSubmit')}
        </Button>
        <Button variant="plain" size="sm" onClick={() => setIsOpen(false)}>
          {t('actions.returnCancel')}
        </Button>
      </div>
    </div>
  );
}
