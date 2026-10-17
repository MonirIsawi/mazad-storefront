'use client';

import { useId, useState } from 'react';
import { cn } from '@shared/lib';
import { fieldControl, FIELD_HINT, FIELD_LABEL } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import { parseAmount } from '../../lib/browse-filters';

export interface PriceRangeProps {
  minPrice?: number;
  maxPrice?: number;
  /** Apply on every keystroke (the sheet) rather than on blur and Enter (the column). */
  isLive: boolean;
  onChange: (range: { minPrice?: number; maxPrice?: number }) => void;
}

/** "Current price: from … to …", in whole dinars, typed in either digit set. */
export function PriceRange({ minPrice, maxPrice, isLive, onChange }: PriceRangeProps) {
  const { t } = useCatalogTranslation();
  const hintId = useId();
  const isInverted = minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice;

  return (
    <fieldset className="grid gap-2" aria-describedby={hintId}>
      <legend className={cn(FIELD_LABEL, 'mb-2')}>{t('filters.price')}</legend>
      <div className="grid grid-cols-2 gap-3">
        <AmountField
          label={t('filters.from')}
          value={minPrice}
          isLive={isLive}
          onCommit={(amount) => onChange({ minPrice: amount, maxPrice })}
        />
        <AmountField
          label={t('filters.to')}
          value={maxPrice}
          isLive={isLive}
          onCommit={(amount) => onChange({ minPrice, maxPrice: amount })}
        />
      </div>
      <p id={hintId} className={isInverted ? 'text-[12.5px] text-destructive' : FIELD_HINT}>
        {isInverted ? t('filters.priceInverted') : t('filters.priceHint')}
      </p>
    </fieldset>
  );
}

function AmountField({
  label,
  value,
  isLive,
  onCommit,
}: {
  label: string;
  value?: number;
  isLive: boolean;
  onCommit: (amount: number | undefined) => void;
}) {
  const id = useId();
  const { number } = useMoney();
  // A draft while typing; the committed value otherwise, so a cleared filter empties the field.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === undefined ? '' : number(value));

  const commit = (text: string) => onCommit(parseAmount(text));

  return (
    <div className="relative flex">
      <label
        htmlFor={id}
        className="pointer-events-none absolute inset-y-0 start-[18px] flex items-center text-[13px] text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        onChange={(event) => {
          setDraft(event.target.value);
          if (isLive) commit(event.target.value);
        }}
        onBlur={(event) => {
          if (!isLive) commit(event.target.value);
          setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
        className={cn(fieldControl(), 'h-14 ps-16 font-tabular')}
      />
    </div>
  );
}
