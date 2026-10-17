'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { GoldTile, IconButton } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { GalleryImage } from '../../types/catalog.types';
import { GalleryCallouts, GalleryCounter, GalleryDots } from './GalleryParts';
import { GalleryLightbox } from './GalleryLightbox';
import { useGalleryTrack } from './useGalleryTrack';

export interface AuctionGalleryProps {
  images: GalleryImage[];
  name: string;
  /** Back, share and the heart, drawn over the photo. */
  tools?: ReactNode;
  /** The seller's own spec rows, pinned onto the first photo (design callout pills). */
  callouts?: string[];
}

/**
 * The product photos (design `.hero.gal`): swipe between them on phones, with dots and a "1 / 5"
 * counter; arrows and thumbnails from 960px. Any photo opens full screen.
 */
export function AuctionGallery({ images, name, tools, callouts = [] }: AuctionGalleryProps) {
  const { t } = useCatalogTranslation();
  const total = images.length;
  const { trackRef, index, goTo, handleScroll } = useGalleryTrack(Math.max(1, total));
  const [zoomAt, setZoomAt] = useState<number | null>(null);

  return (
    <div className="grid gap-3">
      <div className="relative -mx-5 h-[420px] overflow-hidden bg-surface-raised lg:mx-0 lg:aspect-[4/3.4] lg:h-auto lg:rounded-3xl lg:border lg:border-border">
        {total === 0 ? (
          <span className="absolute inset-0 grid place-items-center bg-tile">
            <GoldTile icon="package" size="xl" />
          </span>
        ) : (
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
          >
            {images.map((image, i) => (
              <button
                key={`${i}-${image.url}`}
                type="button"
                onClick={() => setZoomAt(i)}
                aria-label={t('gallery.view', { index: i + 1, total })}
                className="relative h-full w-full shrink-0 cursor-zoom-in snap-center"
              >
                <Image
                  src={image.url}
                  alt={t('detail.photoLabel', { name, index: i + 1, total })}
                  fill
                  sizes="(min-width: 960px) 640px, 100vw"
                  className="object-cover"
                  priority={i === 0}
                />
                {i === 0 ? <GalleryCallouts items={callouts} /> : null}
              </button>
            ))}
          </div>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-shade lg:bg-none"
        />
        {tools ? (
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">{tools}</div>
        ) : null}

        {total > 1 ? (
          <>
            <IconButton
              name="caret-left"
              tone="glass"
              isDirectional
              label={t('detail.photoPrevious')}
              className="absolute inset-y-0 start-4 my-auto hidden lg:inline-flex"
              onClick={() => goTo(index - 1)}
            />
            <IconButton
              name="caret-right"
              tone="glass"
              isDirectional
              label={t('detail.photoNext')}
              className="absolute inset-y-0 end-4 my-auto hidden lg:inline-flex"
              onClick={() => goTo(index + 1)}
            />
            <GalleryDots
              total={total}
              index={index}
              onSelect={goTo}
              className="absolute inset-x-0 bottom-9 lg:bottom-4"
            />
          </>
        ) : null}
        {total > 0 ? (
          <GalleryCounter
            index={index}
            total={total}
            className="absolute end-4 bottom-9 lg:bottom-4"
          />
        ) : null}
      </div>

      {total > 1 ? (
        <div className="hidden grid-cols-5 gap-2.5 lg:grid">
          {images.slice(0, 5).map((image, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('gallery.thumb', { index: i + 1, total })}
              aria-current={i === index}
              className={cn(
                'relative aspect-square overflow-hidden rounded-[18px] border border-border transition-opacity',
                i === index ? 'opacity-100 ring-2 ring-gold' : 'opacity-70 hover:opacity-100',
              )}
            >
              <Image src={image.thumbUrl} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {zoomAt !== null ? (
        <GalleryLightbox images={images} startAt={zoomAt} onClose={() => setZoomAt(null)} />
      ) : null}
    </div>
  );
}
