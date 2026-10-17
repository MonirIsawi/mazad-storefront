'use client';

import { Chip, FIELD_LABEL, Input, Price, Select } from '@shared/components/ui';
import { SegmentedControl } from '@shared/components/ios';
import { useLocale, useMoney } from '@shared/hooks';
import { formatDateTime, pickLocalizedName, resolveThumbUrl } from '@shared/lib';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import { parseDinars, type AuctionField, type AuctionFormState } from '../../lib/auction-payload';
import { fromDateTimeInputValue } from '../../lib/datetime-input';
import type { SellerProduct } from '../../types/selling.types';
import { LotRow } from '../LotRow';
import type { ExtensionRule } from './AuctionSummaryCard';

const DURATION_DAYS = [1, 3, 5, 7] as const;

export interface AuctionFieldsProps {
  state: AuctionFormState;
  set: <K extends AuctionField>(key: K, value: AuctionFormState[K]) => void;
  fieldError: (key: AuctionField) => string | undefined;
  products: SellerProduct[];
  /** The product is fixed once the auction exists (UpdateAuctionDto has no productId). */
  isProductLocked: boolean;
  /** The step Bidoom's ladder gives the typed opening price. */
  step: string | null;
  rule: ExtensionRule | null;
  durationDays: number | null;
  onDuration: (days: number) => void;
  onEndsAt: (value: string) => void;
}

/** The listing's inputs (design `create-auction`), the step and extension shown, not asked. */
export function AuctionFields({
  state,
  set,
  fieldError,
  products,
  isProductLocked,
  step,
  rule,
  durationDays,
  onDuration,
  onEndsAt,
}: AuctionFieldsProps) {
  const { t } = useSellingTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  // The typed amount back in words ("= 1,250,000 IQD"), so a slipped zero is seen at once.
  const preview = (text: string) => {
    const parsed = parseDinars(text);
    return 'value' in parsed && parsed.value > 0 ? `= ${money(String(parsed.value))}` : undefined;
  };
  const chosen = products.find((product) => product.id === state.productId);
  const cover = chosen?.images.find((image) => image.isCover) ?? chosen?.images[0];
  const endsAt = fromDateTimeInputValue(state.endsAt);

  return (
    <div className="grid gap-[18px]">
      <div className="grid gap-2.5">
        <Select
          label={t('fields.product')}
          placeholder={t('form.selectProduct')}
          options={products.map((product) => ({
            value: product.id,
            label: pickLocalizedName(product, locale),
          }))}
          disabled={isProductLocked}
          value={state.productId}
          onChange={(event) => set('productId', event.target.value)}
          error={fieldError('productId')}
        />
        {chosen ? (
          <LotRow
            thumbUrl={resolveThumbUrl(cover?.thumbUrl ?? cover?.url)}
            title={pickLocalizedName(chosen, locale)}
          >
            <span className="text-xs text-muted-foreground">
              {t('products.meta', {
                category: chosen.category.name,
                condition: t(`condition.${chosen.condition}`),
              })}{' '}
              ·{' '}
              {chosen.images.length === 0
                ? t('products.noImages')
                : t('products.imageCount', { count: chosen.images.length })}
            </span>
          </LotRow>
        ) : null}
      </div>

      <Input
        label={t('fields.startingPrice')}
        inputMode="numeric"
        className="font-tabular"
        value={state.startingPrice}
        onChange={(event) => set('startingPrice', event.target.value)}
        hint={preview(state.startingPrice) ?? t('fields.startingPriceHint')}
        error={fieldError('startingPrice')}
        trailing={
          <span className="pe-3 text-sm text-muted-foreground">{t('fields.currency')}</span>
        }
        data-testid="auction-startingPrice"
      />

      <section className="grid gap-2" aria-labelledby="auction-step">
        <h2 id="auction-step" className={FIELD_LABEL}>
          {t('fields.bidStep')}
        </h2>
        {step ? (
          <p className="flex h-14 items-center gap-2 rounded-lg border border-border bg-surface-raised px-[18px] text-sm text-foreground-soft">
            <Price value={step} size="sm" />
            <span>{t('fields.bidStepAt')}</span>
          </p>
        ) : null}
        <p
          className="text-[12.5px] leading-[1.6] text-muted-foreground"
          data-testid="auction-ladder"
        >
          {t('fields.incrementLadder')}
        </p>
      </section>

      <section className="grid gap-2" aria-labelledby="auction-extension">
        <h2 id="auction-extension" className={FIELD_LABEL}>
          {t('fields.extension')}
        </h2>
        <p className="rounded-lg border border-border bg-surface-raised px-[18px] py-3.5 text-[13px] leading-[1.6] text-foreground-soft">
          {rule ? t('fields.extensionRule', { ...rule }) : t('fields.extensionPlatform')}
        </p>
      </section>

      <div className="grid gap-2">
        <span className={FIELD_LABEL}>{t('fields.start')}</span>
        <SegmentedControl
          label={t('fields.start')}
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
      </div>

      <div className="grid gap-2">
        <span className={FIELD_LABEL}>{t('auctions.durationTitle')}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('auctions.durationTitle')}>
          {DURATION_DAYS.map((days) => (
            <Chip key={days} isActive={durationDays === days} onClick={() => onDuration(days)}>
              {t('auctions.durationDays', { count: days })}
            </Chip>
          ))}
        </div>
        <Input
          label={t('fields.endsAt')}
          type="datetime-local"
          value={state.endsAt}
          onChange={(event) => onEndsAt(event.target.value)}
          hint={endsAt ? t('auctions.endsAt', { date: formatDateTime(endsAt, locale) }) : undefined}
          error={fieldError('endsAt')}
        />
      </div>

      <Input
        label={t('fields.buyNowPrice')}
        inputMode="numeric"
        className="font-tabular"
        value={state.buyNowPrice}
        onChange={(event) => set('buyNowPrice', event.target.value)}
        hint={preview(state.buyNowPrice) ?? t('fields.buyNowHint')}
        error={fieldError('buyNowPrice')}
        trailing={
          <span className="pe-3 text-sm text-muted-foreground">{t('fields.currency')}</span>
        }
      />
    </div>
  );
}
