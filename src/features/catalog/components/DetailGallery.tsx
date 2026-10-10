'use client';

import Image from 'next/image';
import { useState } from 'react';
import { IconButton } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../hooks/useCatalogTranslation';

export interface DetailGalleryProps {
  /** Resolved image URLs, cover first. */
  images: string[];
  name: string;
}

/**
 * Every product photo: the main image with previous/next (also the arrow keys), "2 / 5", and a
 * row of thumbnails to jump to one. A click on the main image opens it full size in a new tab.
 */
export function DetailGallery({ images, name }: DetailGalleryProps) {
  const { t } = useCatalogTranslation();
  const [index, setIndex] = useState(0);
  const current = images[Math.min(index, images.length - 1)] ?? images[0];
  const total = images.length;
  const go = (next: number) => setIndex((next + total) % total);
  if (!current) return null;

  return (
    <div
      className="absolute inset-0"
      onKeyDown={(event) => {
        if (total < 2) return;
        // Visual direction: in Arabic the next photo is to the left.
        const rtl = document.dir === 'rtl';
        if (event.key === 'ArrowRight') go(index + (rtl ? -1 : 1));
        if (event.key === 'ArrowLeft') go(index + (rtl ? 1 : -1));
      }}
    >
      <a
        href={current}
        target="_blank"
        rel="noreferrer"
        aria-label={t('detail.photoOpen', { index: index + 1, total })}
        className="absolute inset-0 block"
      >
        <Image
          src={current}
          alt={t('detail.photoLabel', { name, index: index + 1, total })}
          fill
          sizes="100vw"
          className="object-cover"
          priority={index === 0}
        />
      </a>
      {total > 1 ? (
        <>
          <div className="absolute inset-y-0 start-3 flex items-center">
            <IconButton
              name="chevron-left"
              tone="glass"
              className="rtl:[&>svg]:-scale-x-100"
              label={t('detail.photoPrevious')}
              onClick={() => go(index - 1)}
            />
          </div>
          <div className="absolute inset-y-0 end-3 flex items-center">
            <IconButton
              name="chevron-right"
              tone="glass"
              className="rtl:[&>svg]:-scale-x-100"
              label={t('detail.photoNext')}
              onClick={() => go(index + 1)}
            />
          </div>
          <span
            className="absolute bottom-9 end-3 rounded-full bg-black/55 px-2.5 py-0.5 text-caption font-semibold text-white tabular-nums"
            data-testid="gallery-indicator"
            aria-live="polite"
          >
            {t('detail.photoCount', { index: index + 1, total })}
          </span>
          <div className="absolute inset-x-3 bottom-9 flex max-w-[60%] gap-1.5 overflow-x-auto">
            {images.map((url, i) => (
              <button
                key={`${i}-${url}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('detail.photoShow', { index: i + 1, total })}
                aria-current={i === index}
                className={cn(
                  'relative size-11 shrink-0 overflow-hidden rounded-md border-2',
                  i === index ? 'border-white' : 'border-transparent opacity-80',
                )}
              >
                <Image src={url} alt="" fill sizes="44px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
