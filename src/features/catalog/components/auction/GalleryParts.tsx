'use client';

import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';

/** The dots under the photo: the current one is a gold bar (design `.dots`). */
export function GalleryDots({
  total,
  index,
  onSelect,
  className,
}: {
  total: number;
  index: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  const { t } = useCatalogTranslation();
  return (
    <div className={cn('flex justify-center gap-0.5', className)}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={t('detail.photoShow', { index: i + 1, total })}
          aria-current={i === index}
          className="grid h-6 min-w-4 place-items-center px-0.5"
        >
          <i
            className={cn(
              'block h-1.5 rounded-full transition-[width,background-color] duration-medium',
              i === index ? 'w-[22px] bg-gold-hi' : 'w-1.5 bg-on-photo/55',
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** "1 / 5" with the camera glyph, on dark glass (design `.gcount`). */
export function GalleryCounter({
  index,
  total,
  className,
}: {
  index: number;
  total: number;
  className?: string;
}) {
  const { t } = useCatalogTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-[rgb(12_11_10/60%)] px-2.5 py-1 text-xs font-semibold text-on-photo backdrop-blur-[8px]',
        className,
      )}
      data-testid="gallery-indicator"
      aria-live="polite"
    >
      <Icon name="camera" size={14} />
      <span className="font-tabular">{t('detail.photoCount', { index: index + 1, total })}</span>
    </span>
  );
}

const CALLOUT_PLACES = ['top-[30%] start-[18px]', 'top-[63%] end-[18px]'];

/** The seller's own spec rows pinned on the first photo (design `.callout`), at most two. */
export function GalleryCallouts({ items }: { items: string[] }) {
  return items.slice(0, 2).map((item, i) => (
    <span
      key={`${i}-${item}`}
      className={cn(
        'absolute inline-flex max-w-[60%] items-center gap-2 rounded-full border border-glass-line bg-[rgb(12_11_10/55%)] py-1 ps-1 pe-3 text-xs font-medium text-on-photo backdrop-blur-[8px]',
        CALLOUT_PLACES[i],
      )}
    >
      <i className="grid size-6 shrink-0 place-items-center rounded-full border border-[rgb(255_245_225/22%)]">
        <Icon name="arrow-up-right" size={12} className="rtl:-scale-x-100" />
      </i>
      <span className="truncate">{item}</span>
    </span>
  ));
}
