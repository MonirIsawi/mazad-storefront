'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Input, Select } from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ios';
import { getErrorCode, getErrorDetail, pickLocalizedName } from '@shared/lib';
import { useLocale, useMoney } from '@shared/hooks';
import { useCreateAuction, useSubmitAuction, useUpdateAuction } from '../hooks/useSellerAuctions';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import { toDateTimeInputValue } from '../lib/datetime-input';
import {
  buildAuctionPayload,
  endAfterDays,
  parseDinars,
  type AuctionField,
  type AuctionFormState,
} from '../lib/auction-payload';
import type { SellerAuction, SellerProduct } from '../types/selling.types';

export interface AuctionFormProps {
  auction?: SellerAuction;
  products: SellerProduct[];
  /** Preselects the product when arriving from a product's "put up for auction". */
  initialProductId?: string;
  /** "List again": an ended listing whose prices pre-fill a new one (same product). */
  relistFrom?: SellerAuction;
  onDone: (auction: SellerAuction) => void;
  onCancel: () => void;
}

const DAY_MS = 24 * 60 * 60_000;
const DURATION_DAYS = [1, 3, 5, 7] as const;

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

/**
 * Listing form: product, opening bid (whole dinars, at least 1,000 IQD, with a grouped preview),
 * start now (default) or at a chosen time, the end (duration presets or a date), optional buy-now.
 * The raise per bid is the platform ladder, explained but not asked. Publish creates and submits
 * in one step; Save draft only saves it. A product without photos can't be published.
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
  const { locale } = useLocale();
  const { money } = useMoney();
  const createAuction = useCreateAuction();
  const updateAuction = useUpdateAuction();
  const submitAuction = useSubmitAuction();
  const [state, setState] = useState(() => initialState(auction, initialProductId, relistFrom));
  const [errors, setErrors] = useState<Partial<Record<AuctionField, string>>>({});

  const mutation = auction ? updateAuction : createAuction;
  const failure = mutation.error ?? submitAuction.error;
  const errorCode = getErrorCode(failure);
  const dateReason =
    errorCode === 'INVALID_AUCTION_DATES' ? getErrorDetail(failure, 'reason') : null;
  const isBusy = mutation.isPending || submitAuction.isPending;

  const chosenProduct = products.find((product) => product.id === state.productId);
  const needsPhoto = chosenProduct !== undefined && chosenProduct.images.length === 0;

  const set = <K extends AuctionField>(key: K, value: AuctionFormState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const preview = (text: string) => {
    const parsed = parseDinars(text);
    return 'value' in parsed && parsed.value > 0 ? money(String(parsed.value)) : null;
  };
  const startingPreview = preview(state.startingPrice);
  const buyNowPreview = preview(state.buyNowPrice);

  const setDuration = (days: number) => set('endsAt', endAfterDays(state, days));

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

  const fieldError = (key: AuctionField) => {
    const message = errors[key];
    return message ? t(message) : undefined;
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(true);
      }}
      noValidate
      className="flex flex-col gap-3"
    >
      <Select
        label={t('fields.product')}
        placeholder={t('form.selectProduct')}
        options={products.map((product) => ({
          value: product.id,
          label: pickLocalizedName(product, locale),
        }))}
        // The product is fixed once the auction exists — UpdateAuctionDto carries only pricing
        // and dates.
        disabled={Boolean(auction)}
        value={state.productId}
        onChange={(event) => set('productId', event.target.value)}
        error={fieldError('productId')}
      />

      <Input
        label={t('fields.startingPrice')}
        inputMode="numeric"
        value={state.startingPrice}
        onChange={(event) => set('startingPrice', event.target.value)}
        hint={startingPreview ? `= ${startingPreview}` : t('fields.startingPriceHint')}
        error={fieldError('startingPrice')}
        data-testid="auction-startingPrice"
      />
      <p className="text-footnote text-muted-foreground" data-testid="auction-ladder">
        {t('fields.incrementLadder')}
      </p>

      <SegmentedControl
        label={t('fields.startsAt')}
        value={state.startMode}
        onChange={(mode) => set('startMode', mode)}
        segments={[
          { id: 'now', label: t('fields.startNow') },
          { id: 'later', label: t('fields.startLater') },
        ]}
      />
      {state.startMode === 'later' ? (
        <Input
          label={t('fields.startsAt')}
          type="datetime-local"
          value={state.startsAt}
          onChange={(event) => set('startsAt', event.target.value)}
          error={fieldError('startsAt')}
        />
      ) : null}

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('auctions.durationTitle')}>
        {DURATION_DAYS.map((days) => (
          <Chip key={days} isActive={false} onClick={() => setDuration(days)}>
            {t('auctions.durationDays', { count: days })}
          </Chip>
        ))}
      </div>
      <Input
        label={t('fields.endsAt')}
        type="datetime-local"
        value={state.endsAt}
        onChange={(event) => set('endsAt', event.target.value)}
        error={fieldError('endsAt')}
      />

      <Input
        label={t('fields.buyNowPrice')}
        inputMode="numeric"
        value={state.buyNowPrice}
        onChange={(event) => set('buyNowPrice', event.target.value)}
        hint={buyNowPreview ? `= ${buyNowPreview}` : t('fields.buyNowHint')}
        error={fieldError('buyNowPrice')}
      />

      {needsPhoto ? (
        <p className="text-footnote text-destructive" data-testid="auction-needs-photo">
          {t('errors.field.photoRequired')}
        </p>
      ) : null}
      {errorCode ? (
        <p role="alert" className="text-footnote text-destructive">
          {dateReason
            ? t(`errors.dates.${dateReason}`, { defaultValue: t(`errors.${errorCode}`) })
            : t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          isLoading={isBusy}
          disabled={needsPhoto}
          data-testid="auction-publish"
        >
          {t('form.publish')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => save(false)}
          data-testid="auction-save-draft"
        >
          {t(auction ? 'form.save' : 'form.saveDraft')}
        </Button>
        <Button type="button" variant="plain" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
