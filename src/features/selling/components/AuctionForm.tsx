'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorCode, getErrorDetail } from '@shared/lib';
import { useCreateAuction, useSubmitAuction, useUpdateAuction } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { initialAuctionState } from '../lib/auction-form-state';
import { ladderStep } from '../lib/bid-ladder';
import {
  buildAuctionPayload,
  endAfterDays,
  parseDinars,
  type AuctionField,
  type AuctionFormState,
} from '../lib/auction-payload';
import { AuctionFields } from './auctions/AuctionFields';
import { AuctionSummaryCard } from './auctions/AuctionSummaryCard';
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

/** The API's rule errors belong to a field, not the banner: they're shown under the input. */
const FIELD_ERRORS: Partial<Record<string, readonly [AuctionField, string]>> = {
  INVALID_BID_STEP: ['minIncrement', 'errors.field.minIncrementInvalid'],
  INVALID_EXTENSION_RULE: ['antiSnipingMinutes', 'errors.field.extensionRuleInvalid'],
};

/**
 * Listing form (Bidoom design `create-auction`): product, opening price (whole dinars, at least
 * 1,000 IQD), the bid step (pre-filled with the suggested step for the opening price until the
 * seller picks one), the automatic extension (minutes and times), start now (default) or at a
 * chosen time, the duration, optional buy-now. Publish creates and submits in one step; Save
 * draft only saves it. A product without photos can't be published.
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
  const [state, setState] = useState(() =>
    initialAuctionState(auction, initialProductId, relistFrom),
  );
  const [errors, setErrors] = useState<Partial<Record<AuctionField, string>>>({});
  // Until the seller sets a step, it follows the suggested step for the typed opening price.
  const [isStepChosen, setIsStepChosen] = useState(() => Boolean(auction ?? relistFrom));
  const [durationDays, setDurationDays] = useState<number | null>(auction ? null : 3);
  // "Start now" counts the summary's duration from when the form opened (close enough to show).
  const [openedAt] = useState(() => Date.now());

  const mutation = auction ? updateAuction : createAuction;
  const failure = mutation.error ?? submitAuction.error;
  const failureCode = getErrorCode(failure);
  const errorCode = failureCode && FIELD_ERRORS[failureCode] ? null : failureCode;
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

  const handleOpening = (text: string) => {
    set('startingPrice', text);
    if (isStepChosen) return;
    const parsed = parseDinars(text);
    set(
      'minIncrement',
      'value' in parsed && parsed.value > 0 ? String(ladderStep(parsed.value)) : '',
    );
  };

  const handleStep = (text: string) => {
    setIsStepChosen(text.trim() !== '');
    set('minIncrement', text);
  };

  const handleRuleError = (failed: unknown) => {
    const code = getErrorCode(failed);
    const fieldError = code ? FIELD_ERRORS[code] : undefined;
    if (fieldError) setErrors((current) => ({ ...current, [fieldError[0]]: fieldError[1] }));
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
    const callbacks = { onSuccess: done, onError: handleRuleError };
    if (auction) {
      updateAuction.mutate({ id: auction.id, values: result.payload, silent: publish }, callbacks);
    } else {
      createAuction.mutate({ values: result.payload, silent: publish }, callbacks);
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
  const stepValue = parseDinars(state.minIncrement);
  const step = 'value' in stepValue && stepValue.value > 0 ? String(stepValue.value) : null;
  const minutes = Number(state.antiSnipingMinutes);
  const times = Number(state.maxExtensions);
  const rule =
    Number.isInteger(minutes) && minutes > 0 && Number.isInteger(times) && times > 0
      ? { minutes, times }
      : null;
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
        opening={openingValue}
        onOpening={handleOpening}
        onStep={handleStep}
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
        step={step}
        rule={rule}
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
