import type { HTMLAttributes } from 'react';
import { cn } from '@shared/lib';

// Status hues are solid, not tinted (Mazad Design System) — a colored fill with a matching
// foreground, not a soft 15%-opacity wash. `discount` is the one exception: it flags a price,
// not a state, so it reads as the quieter tinted pill.
const TONE_CLASSES = {
  live: 'bg-live text-live-foreground',
  upcoming: 'bg-info text-info-foreground',
  warning: 'bg-warning text-warning-foreground',
  neutral: 'bg-foreground/55 text-surface',
  primary: 'bg-primary text-primary-foreground',
  discount: 'bg-primary-tint text-primary',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof TONE_CLASSES;
  /** The pulsing indicator that marks a genuinely live auction. */
  hasDot?: boolean;
}

export function Badge({
  tone = 'neutral',
  hasDot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-2.5 py-1',
        'text-caption-2 leading-[1.4] font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {hasDot ? (
        <span className="size-1.5 shrink-0 animate-pulse-dot rounded-full bg-current" aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
