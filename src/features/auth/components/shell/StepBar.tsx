'use client';

import { cn } from '@shared/lib';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';

/** Real steps only (design `.steps`): one bar per step, the current one and those before in gold. */
export function StepBar({ step, total }: { step: number; total: number }) {
  const { t } = useAuthTranslation();
  return (
    <div className="grid gap-2">
      <div aria-hidden className="flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <i
            key={index}
            className={cn('h-1 flex-1 rounded-full', index < step ? 'bg-gold' : 'bg-surface-high')}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('shell.step', { step, total })}</p>
    </div>
  );
}
