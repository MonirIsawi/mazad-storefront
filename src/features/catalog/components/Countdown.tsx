'use client';

import { useCountdown, useLocale } from '@shared/hooks';
import { formatDuration } from '@shared/lib';

// The ticking lives in useCountdown so every clock in the app shares one interval and one
// reading of the server offset (ADR-013) — this is just the type it is set in.
export function Countdown({ endsAt, className }: { endsAt: string; className?: string }) {
  const remaining = useCountdown(endsAt);
  const { locale } = useLocale();

  return <span className={className}>{formatDuration(remaining, locale)}</span>;
}
