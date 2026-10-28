'use client';

import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale, useTheme } from '@shared/hooks';
import { cn } from '@shared/lib';
import { IconButton } from '@shared/components/ui';

/**
 * The header's appearance and language switches, beside the bell and avatar (or sign in): a sun or
 * moon for the theme it switches to, and the other language's short name ("EN" / "ع").
 * Rendered only after hydration: both choices live in this device's storage, which the server
 * can't see.
 */
const subscribeNoop = () => () => {};

export function PreferenceToggles({ className }: { className?: string }) {
  const { t } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const { locale, changeLocale } = useLocale();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  if (!isHydrated) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <IconButton
        name={nextTheme === 'light' ? 'sun' : 'moon'}
        label={t('theme.switchTo', { theme: t(`theme.${nextTheme}`) })}
        onClick={() => setTheme(nextTheme)}
      />
      <button
        type="button"
        lang={nextLocale}
        aria-label={t(`locale.${nextLocale}`)}
        title={t(`locale.${nextLocale}`)}
        onClick={() => changeLocale(nextLocale)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-[13px] font-semibold text-foreground transition-transform duration-fast ease-ios active:scale-94"
      >
        {t(`locale.short.${nextLocale}`)}
      </button>
    </div>
  );
}
