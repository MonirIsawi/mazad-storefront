'use client';

import { cn } from '@shared/lib';
import { useMoney } from '@shared/hooks';

const TONE = {
  plain: 'text-foreground',
  /** prices are gold where they are the point: lot cards, the price box, your bid */
  gold: 'text-gold',
  /** over a photo: the bright gold reads on the dark fade in both themes */
  photo: 'text-on-photo-gold',
  photoPlain: 'text-on-photo',
} as const;

const SIZE = {
  xs: 'text-[13px]',
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
  xl: 'text-[34px] font-light leading-[1.05] tracking-[-0.01em]',
  xxl: 'text-price-lg font-light tracking-[-0.01em]',
} as const;

export interface PriceProps {
  /** A Decimal string from the API (never a number). */
  value: string | null | undefined;
  tone?: keyof typeof TONE;
  size?: keyof typeof SIZE;
  className?: string;
}

/**
 * A price (design `.price`): the amount in Jost with the currency label set smaller and muted.
 * Never splits from its currency across lines.
 */
export function Price({ value, tone = 'plain', size = 'md', className }: PriceProps) {
  const { moneyParts } = useMoney();
  const parts = moneyParts(value);
  return (
    <span className={cn('font-num whitespace-nowrap', TONE[tone], SIZE[size], className)}>
      {parts ? (
        <>
          {parts.amount}{' '}
          <span
            className={cn(
              'text-[max(11px,0.55em)] font-normal',
              tone === 'photo' || tone === 'photoPlain'
                ? 'text-on-photo/70'
                : 'text-muted-foreground',
            )}
          >
            {parts.currency}
          </span>
        </>
      ) : (
        '—'
      )}
    </span>
  );
}
