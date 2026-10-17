'use client';

import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';

/** Five large stars as one radio group, with the word for the chosen rating under them. */
export function RateStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const { t } = useOrdersTranslation();
  return (
    <div className="grid justify-items-center gap-1.5 py-0.5">
      <div role="radiogroup" aria-label={t('rating.starsLabel')} className="flex gap-1.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((stars) => (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={stars === value}
            aria-label={t('rating.star', { count: stars })}
            onClick={() => onChange(stars)}
            className={cn(
              'grid size-[52px] place-items-center rounded-full transition-transform duration-fast ease-ios active:scale-88',
              stars <= value ? 'text-gold' : 'text-muted-foreground',
            )}
          >
            <Icon name="star" size={38} isFilled={stars <= value} />
          </button>
        ))}
      </div>
      <b
        aria-live="polite"
        className="min-h-[1.5em] text-[15px] font-medium text-gold light:text-gold-lo"
      >
        {t(`rating.words.${value}`)}
      </b>
    </div>
  );
}
