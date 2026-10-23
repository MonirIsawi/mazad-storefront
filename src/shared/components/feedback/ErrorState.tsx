'use client';

import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@shared/components/ui';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** A failed load inside a page (design error, smaller): the orb, what happened, and a retry. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation('common');

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-7 py-12 text-center"
    >
      <span
        aria-hidden
        className="grid size-20 place-items-center rounded-full border border-border-strong bg-surface bg-[radial-gradient(circle_at_50%_35%,var(--color-gold-soft),transparent_70%)] text-gold light:text-gold-lo"
      >
        <Icon name="warning" size={32} />
      </span>
      <p className="font-display text-[22px] leading-[1.3] text-foreground">
        {title ?? t('state.error')}
      </p>
      <p className="max-w-[34ch] text-[15px] leading-[1.7] text-foreground-soft">
        {message ?? t('state.errorDetail')}
      </p>
      {onRetry ? (
        <Button onClick={onRetry} className="mt-1">
          <Icon name="arrows-clockwise" size={20} />
          {t('state.retry')}
        </Button>
      ) : null}
    </div>
  );
}
