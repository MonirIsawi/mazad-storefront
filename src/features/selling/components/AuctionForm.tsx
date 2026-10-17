'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorCode, getErrorDetail } from '@shared/lib';
import { useCreateAuction, useSubmitAuction, useUpdateAuction } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { toDateTimeInputValue } from '../lib/datetime-input';
import { ladderStep } from '../lib/bid-ladder';
import {
  buildAuctionPayload,
  endAfterDays,
  parseDinars,
  type AuctionField,
  type AuctionFormState,
} from '../lib/auction-payload';
import { AuctionFields } from './auctions/AuctionFields';
import { AuctionSummaryCard, type ExtensionRule } from './auctions/AuctionSummaryCard';
import type { SellerAuction, SellerProduct } from '../types/selling.types';

export interface AuctionFormProps {
  auction?: SellerAuction;
  products: SellerProduct[];
  /** Preselects the product when arriving from a product's "List in auction". */
  initialProductId?: string;
  /** "List again": an ended listing whose prices pre-fill a new one (same product). */
  relistFrom?: SellerAuction;
  onDone: (auction: SellerAuction) => void;
  onCancel: () => void;
}

const DAY_MS = 24 * 60 * 60_000;

function initialState(
  auction: SellerAuction | undefined,
  initialProductId: string | undefined,
  relistFrom: SellerAuction | undefined,
): AuctionFormState {
  const now = Date.now();
  const whole = (value: string | null | undefined) =>
    value ? String(Math.round(Number(value))) : '';
  if (auction) {
    // A draft whose start already passed is published as "start now".
    const startsLater = Date.parse(auction.startsAt) > now;
    return {
      productId: auction.product?.id ?? '',
      startingPrice: whole(auction.startingPrice),
      startMode: startsLater ? 'later' : 'now',
      startsAt: toDateTimeInputValue(startsLater ? auction.startsAt : new Date(now).toISOString()),
      endsAt: toDateTimeInputValue(
        Date.parse(auction.endsAt) > now + DAY_MS
          ? auction.endsAt
          : new Date(now + 3 * DAY_MS).toISOString(),
      ),
      buyNowPrice: whole(auction.buyNowPrice),
    };
  }
  // Start now, for 3 days: the common case needs no date picking at all.
  return {
    productId: relistFrom?.product?.id ?? initialProductId ?? '',
    startingPrice: whole(relistFrom?.startingPrice),
    startMode: 'now',
    startsAt: toDateTimeInputValue(new Date(now + 60 * 60_000).toISOString()),
    endsAt: toDateTimeInputValue(new Date(now + 3 * DAY_MS).toISOString()),
    buyNowPrice: whole(relistFrom?.buyNowPrice),
  };
}

/** The extension rule an existing auction's payload carries (a new one gets the platform's). */
function extensionRule(source: SellerAuction | undefined): ExtensionRule | null {
  if (source?.antiSnipingMinutes == null || source.maxExtensions == null) return null;
  return { minutes: source.antiSnipingMinutes, times: source.maxExtensions };
}

/**
 * Listing form (Bidoom design `create-auction`): product, opening price (whole dinars, at least
 * 1,000 IQD), start now (default) or at a chosen time, the duration, optional buy-now. The bid
 * step and the extension are Bidoom's rules, shown but not asked: the step from the API's price
 * ladder, the extension from the auction's payload. Publish creates and submits in one step;
 * Save draft only saves it. A product without photos can't be published.
 */
export function AuctionForm({
  auction,
  products,
  initialProductId,
  relistFrom,
  onDone,
  onCancel,
}: AuctionFormProps) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const createAuction = useCreateAuction();
  const updateAuction = useUpdateAuction();
  const submitAuction = useSubmitAuction();
  const [state, setState] = useState(() => initialState(auction, initialProductId, relistFrom));
  const [errors, setErrors] = useState<Partial<Record<AuctionField, string>>>({});
  const [durationDays, setDurationDays] = useState<number | null>(auction ? null : 3);
  // "Start now" counts the summary's duration from when the form opened (close enough to show).
  const [openedAt] = useState(() => Date.now());

  const mutation = auction ? updateAuction : createAuction;
  const failure = mutation.error ?? submitAuction.error;
  const errorCode = getErrorCode(failure);
  const dateReason =
    errorCode === 'INVALID_AUCTION_DATES' ? getErrorDetail(failure, 'reason') : null;
  const isBusy = mutation.isPending || submitAuction.isPending;

  const chosenProduct = products.find((product) => product.id === state.productId);
  const needsPhoto = chosenProduct !== undefined && chosenProduct.images.length === 0;
  const opening = parseDinars(state.startingPrice);
  const openingValue = 'value' in opening && opening.value > 0 ? opening.value : null;

  const set = <K extends AuctionField>(key: K, value: AuctionFormState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = (publish: boolean) => {
    const result = buildAuctionPayload(state);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // Buyers don't bid on what they can't see: at least one photo before it goes live.
    if (publish && needsPhoto) return;
    const done = (saved: SellerAuction) => {
      if (!publish) return onDone(saved);
      submitAuction.mutate(saved.id, { onSuccess: onDone });
    };
    if (auction) {
      updateAuction.mutate(
        { id: auction.id, values: result.payload, silent: publish },
        { onSuccess: done },
      );
    } else {
      createAuction.mutate({ values: result.payload, silent: publish }, { onSuccess: done });
    }
  };

  const start = state.startMode === 'now' ? openedAt : Date.parse(state.startsAt);
  const hours = Math.round((Date.parse(state.endsAt) - start) / 3_600_000);
  const duration =
    !Number.isFinite(hours) || hours <= 0
      ? null
      : hours % 24 === 0
        ? t('auctions.durationDays', { count: hours / 24 })
        : t('summary.hours', { count: hours });

  const message = (key: AuctionField) => (errors[key] ? t(errors[key] ?? '') : undefined);
  const error = needsPhoto ? (
    <p className="text-[13px] text-destructive" data-testid="auction-needs-photo">
      {t('errors.field.photoRequired')}
    </p>
  ) : errorCode ? (
    <p role="alert" className="text-[13px] text-destructive">
      {dateReason
        ? t(`errors.dates.${dateReason}`, { defaultValue: t(`errors.${errorCode}`) })
        : t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
    </p>
  ) : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(true);
      }}
      noValidate
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8"
    >
      <AuctionFields
        state={state}
        set={set}
        fieldError={message}
        products={products}
        isProductLocked={Boolean(auction)}
        step={openingValue ? String(ladderStep(openingValue)) : null}
        rule={extensionRule(auction)}
        durationDays={durationDays}
        onDuration={(days) => {
          setDurationDays(days);
          set('endsAt', endAfterDays(state, days));
        }}
        onEndsAt={(value) => {
          setDurationDays(null);
          set('endsAt', value);
        }}
      />
      <AuctionSummaryCard
        opening={openingValue ? String(openingValue) : null}
        step={openingValue ? String(ladderStep(openingValue)) : null}
        rule={extensionRule(auction)}
        duration={duration}
        isBusy={isBusy}
        canPublish={!needsPhoto}
        isEdit={Boolean(auction)}
        error={error}
        onSaveDraft={() => save(false)}
        onCancel={onCancel}
      />
    </form>
  );
}
