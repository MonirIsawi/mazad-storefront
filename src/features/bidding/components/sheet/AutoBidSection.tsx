'use client';

import { useId, type ReactNode } from 'react';
import { Button, Icon, Notice, Toggle, type IconName } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { cn, toAsciiDigits } from '@shared/lib';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import { quickMaximums } from '../../lib/bid-amount';

export interface AutoBidSectionProps {
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
  /** The maximum being set (a number once typed or picked). */
  maximum: number | null;
  onMaximum: (value: number | null) => void;
  minimumBid: number;
  increment: number;
  isLeading: boolean;
  buyNowPrice: number | null;
  onBuyNow?: () => void;
  /** The active auto-bid's "Turn off", when there is one. */
  turnOff?: ReactNode;
}

/**
 * Automatic bidding in the bid sheet (design `.autobid`): a switch, then a private maximum and how
 * it is spent: the lowest bid now (nothing while you lead), then one step above each rival, up to
 * the maximum. Nobody sees it.
 */
export function AutoBidSection(props: AutoBidSectionProps) {
  const { isOn, onToggle, maximum, onMaximum, minimumBid, increment } = props;
  const { t } = useBiddingTranslation();
  const { money, number } = useMoney();
  const fieldId = useId();
  const max = maximum ?? 0;

  return (
    <div
      className={cn(
        'grid gap-3.5 rounded-xl border p-3.5',
        isOn ? 'border-gold-line bg-gold-soft/40' : 'border-border',
      )}
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3">
        <span aria-hidden className="grid size-11 place-items-center rounded-[14px] border bg-tile">
          <Icon name="lightning" tone="gold" size={24} isFilled />
        </span>
        <span className="grid gap-0.5">
          <b className="text-[15px] font-medium text-foreground">{t('autoBid.title')}</b>
          <small className="text-xs text-foreground-soft">
            {isOn ? t('autoBid.onHint') : t('autoBid.offHint')}
          </small>
        </span>
        <Toggle isOn={isOn} onChange={onToggle} label={t('autoBid.title')} />
      </div>

      {isOn ? (
        <>
          <div className="grid gap-2">
            <label htmlFor={fieldId} className="text-[13.5px] font-medium text-foreground-soft">
              {t('autoBid.maxAmount')}
            </label>
            <div className="flex h-14 items-center gap-3 rounded-lg border border-gold-line bg-surface px-[18px] focus-within:border-gold">
              <Icon name="pencil" size={16} className="text-foreground-soft" />
              <input
                id={fieldId}
                inputMode="numeric"
                autoComplete="off"
                value={maximum == null ? '' : number(maximum)}
                onChange={(event) => {
                  const digits = toAsciiDigits(event.target.value).replace(/[^\d]/g, '');
                  onMaximum(digits ? Number(digits) : null);
                }}
                className="min-w-0 flex-1 bg-transparent font-num text-lg text-foreground outline-none"
              />
              <span className="text-xs text-muted-foreground">{t('sheet.currency')}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {quickMaximums(minimumBid, increment).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === maximum}
                onClick={() => onMaximum(value)}
                className={cn(
                  'h-10 rounded-full border font-num text-[13px] font-medium',
                  value === maximum
                    ? 'border-gold-line bg-gold-soft text-gold light:text-gold-lo'
                    : 'border-border bg-surface-raised text-foreground',
                )}
              >
                {number(value)}
              </button>
            ))}
          </div>
          {props.buyNowPrice != null && max >= props.buyNowPrice ? (
            <Notice>
              {t('autoBid.reachesBuyNow', { amount: money(String(props.buyNowPrice)) })}{' '}
              {props.onBuyNow ? (
                <Button
                  variant="plain"
                  size="sm"
                  className="h-auto px-1 underline"
                  onClick={props.onBuyNow}
                >
                  {t('form.buyNowShort')}
                </Button>
              ) : null}
            </Notice>
          ) : null}
          <ul className="grid gap-2.5 text-[13px] text-foreground-soft">
            <How icon="paddle">
              {props.isLeading
                ? t('autoBid.howLeading')
                : t('autoBid.howNow', { amount: money(String(minimumBid)) })}
            </How>
            <How icon="rising">
              {t('autoBid.howStep', { amount: money(String(max || minimumBid)) })}
            </How>
            <How icon="lock">{t('autoBid.howPrivate')}</How>
          </ul>
          {props.turnOff}
        </>
      ) : null}
    </div>
  );
}

function How({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-gold" />
      <span>{children}</span>
    </li>
  );
}
