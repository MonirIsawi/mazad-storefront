'use client';

import { useHomeTranslation } from '../hooks/useHomeTranslation';
import { useTimeOfDay } from '../hooks/useTimeOfDay';

/**
 * The phone greeting and headline: "Good evening, Zainab" with the signed-in user's first name,
 * by the visitor's own clock. The headline is the page's h1 on phones.
 */
export function HomeGreeting({ userName }: { userName?: string }) {
  const { t } = useHomeTranslation();
  const part = useTimeOfDay();
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <div className="grid gap-1.5 lg:hidden">
      {/* Reserved height: the greeting arrives after hydration without moving the headline. */}
      <p className="min-h-[1.45em] text-[13px] text-foreground-soft">
        {part
          ? firstName
            ? t(`greeting.${part}Named`, { name: firstName })
            : t(`greeting.${part}`)
          : null}
      </p>
      <h1 className="font-display text-display font-normal text-foreground">{t('headline')}</h1>
    </div>
  );
}
