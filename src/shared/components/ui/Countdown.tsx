'use client';

import { useTranslation } from 'react-i18next';
import { cn, formatDuration } from '@shared/lib';
import { useCountdown, useLocale } from '@shared/hooks';

/** Under an hour left the clock turns amber (design `.timer.hot`). */
const HOT_MS = 60 * 60 * 1000;

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: Math.floor(total / 86_400),
    hh: pad(Math.floor((total % 86_400) / 3600)),
    mm: pad(Math.floor((total % 3600) / 60)),
    ss: pad(total % 60),
  };
}

/**
 * The countdown as text (design `.cd`): Western tabular digits so the width never jitters, and
 * isolated so a digits-only time reads left to right inside Arabic.
 */
export function CountdownText({
  endsAt,
  className,
}: {
  endsAt: string | null | undefined;
  className?: string;
}) {
  const { locale } = useLocale();
  const ms = useCountdown(endsAt);
  return (
    <span className={cn('inline-block font-tabular [unicode-bidi:isolate]', className)}>
      {formatDuration(ms, locale)}
    </span>
  );
}

const TIMER_TONE = {
  /** glass boxes over a photo (the featured lot) */
  photo: 'bg-[rgb(244_238_228/12%)] text-on-photo backdrop-blur-[8px]',
  /** boxes on a surface (the price box) */
  solid: 'border border-border bg-surface-raised text-foreground',
} as const;

/**
 * The boxed countdown (design `.timer`): hours, minutes, seconds; from a day out, days, hours and
 * minutes. Always laid out left to right. Turns amber in the last hour.
 */
export function TimerBoxes({
  endsAt,
  tone = 'solid',
  size = 'md',
  isUrgent = false,
  className,
}: {
  endsAt: string | null | undefined;
  tone?: keyof typeof TIMER_TONE;
  size?: 'sm' | 'md';
  /** Amber now, whatever the time left: the viewer was outbid (design `.timer.hot`). */
  isUrgent?: boolean;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const { locale } = useLocale();
  const ms = useCountdown(endsAt);
  const p = parts(ms);
  const boxes = p.days > 0 ? [t('time.days', { count: p.days }), p.hh, p.mm] : [p.hh, p.mm, p.ss];
  const isHot = ms > 0 && (isUrgent || ms <= HOT_MS);

  return (
    <span
      role="timer"
      aria-label={`${t('time.left')} ${formatDuration(ms, locale)}`}
      dir="ltr"
      className={cn('inline-flex gap-1.5', className)}
    >
      {boxes.map((box, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            'grid place-items-center rounded-[12px] px-1.5 font-tabular font-medium',
            size === 'sm' ? 'h-9 min-w-9 text-[15px]' : 'h-10 min-w-10 text-[17px]',
            TIMER_TONE[tone],
            isHot && 'text-warning',
          )}
        >
          {box}
        </span>
      ))}
    </span>
  );
}
