'use client';

import { useId, useState } from 'react';
import { Icon, IconButton } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { cn, toAsciiDigits } from '@shared/lib';
import type { BidDraft } from '../../hooks/useBidDraft';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import { quickAmounts, roundUpToStep, type RoundedBid } from '../../lib/bid-amount';

/**
 * The amount in the bid sheet (design `.bidamt` + `.qamts`): minus and plus in whole steps, the
 * amount itself to tap and type (any amount from the minimum up; one between steps is rounded up,
 * and says so), and four quick amounts.
 */
export function BidAmountField({ draft, topBid }: { draft: BidDraft; topBid: number }) {
  const { t } = useBiddingTranslation();
  const { money, number } = useMoney();
  const id = useId();
  const [typed, setTyped] = useState<string | null>(null);
  const [rounding, setRounding] = useState<RoundedBid | null>(null);

  const commit = (text: string) => {
    setTyped(null);
    const value = Number(toAsciiDigits(text).replace(/[^\d.]/g, ''));
    if (!text.trim() || !Number.isFinite(value)) return;
    const result = roundUpToStep(value, draft.minimumBid, draft.increment);
    draft.setAmount(result.amount);
    setRounding(result.adjustment === 'none' ? null : result);
  };
  const step = (delta: number) => {
    setRounding(null);
    draft.setAmount(draft.amount + delta * draft.increment);
  };

  return (
    <div className="grid gap-3.5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <IconButton
          name="minus"
          tone="ring"
          size={52}
          label={t('sheet.stepDown')}
          disabled={draft.amount <= draft.minimumBid}
          onClick={() => step(-1)}
        />
        <label
          htmlFor={id}
          className="grid cursor-text justify-items-center gap-0.5 rounded-xl border border-gold-line bg-surface-raised px-3 py-2.5 shadow-[0_0_0_4px_var(--color-gold-soft)] focus-within:border-gold"
        >
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-soft">
            <Icon name="pencil" size={13} />
            {t('sheet.typeHint')}
          </span>
          <span className="flex items-baseline gap-1.5">
            <input
              id={id}
              inputMode="numeric"
              autoComplete="off"
              value={typed ?? number(draft.amount)}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => setTyped(event.target.value)}
              onBlur={(event) => commit(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commit(event.currentTarget.value);
                }
              }}
              className="w-full min-w-0 bg-transparent text-center font-num text-[34px] leading-tight font-light text-gold outline-none light:text-gold-lo"
            />
            <small className="text-xs text-muted-foreground">{t('sheet.currency')}</small>
          </span>
        </label>
        <IconButton
          name="plus"
          tone="ring"
          size={52}
          label={t('sheet.stepUp')}
          onClick={() => step(1)}
        />
      </div>

      {rounding ? (
        <p role="status" className="text-[13px] font-medium text-warning">
          {rounding.adjustment === 'minimum'
            ? t('sheet.raisedToMinimum', { amount: money(String(rounding.amount)) })
            : t('sheet.roundedUp', { amount: money(String(rounding.amount)) })}
        </p>
      ) : null}

      <div className="grid grid-cols-4 gap-2">
        {quickAmounts(draft.minimumBid, draft.increment).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === draft.amount}
            onClick={() => {
              setRounding(null);
              draft.setAmount(value);
            }}
            className={cn(
              'grid min-h-14 content-center justify-items-center gap-0.5 rounded-[16px] border px-1 py-2 transition-colors',
              value === draft.amount
                ? 'border-gold-line bg-gold-soft text-gold light:text-gold-lo'
                : 'border-border bg-surface-raised text-foreground',
            )}
          >
            <b className="font-num text-[13.5px] font-medium">{number(value)}</b>
            <small
              className={cn(
                'font-num text-[11px]',
                value !== draft.amount && 'text-foreground-soft',
              )}
            >
              +{number(Math.max(0, value - topBid))}
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}
