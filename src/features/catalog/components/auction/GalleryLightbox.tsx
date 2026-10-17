'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useCatalogTranslation } from '../../hooks/useCatalogTranslation';
import type { GalleryImage } from '../../types/catalog.types';
import { GalleryCounter } from './GalleryParts';
import { useGalleryTrack } from './useGalleryTrack';

/**
 * Full-screen photos (design `.lightbox`): swipe between them, arrows from 960px, thumbnails at
 * the foot, a double tap (or double click) to zoom and pinch on touch. A native modal dialog, so
 * focus stays inside and Escape closes it. Always dark: photos read best on black.
 */
export function GalleryLightbox({
  images,
  startAt,
  onClose,
}: {
  images: GalleryImage[];
  startAt: number;
  onClose: () => void;
}) {
  const { t } = useCatalogTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const total = images.length;
  const { trackRef, index, goTo, handleScroll } = useGalleryTrack(total, startAt);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Open on the photo that was tapped, without animating there.
    goTo(startAt, 'instant');
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [goTo, startAt]);

  const select = (next: number) => {
    setIsZoomed(false);
    goTo(next);
  };

  return (
    <dialog
      ref={ref}
      data-surface="dark"
      aria-label={t('gallery.title')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 flex h-dvh max-h-none w-screen max-w-none flex-col bg-background-deep p-0 text-on-photo backdrop:bg-black open:flex"
    >
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 lg:pt-5">
        <GalleryCounter index={index} total={total} />
        <span className="min-w-0 flex-1" />
        <IconButton name="x" tone="glass" label={t('gallery.close')} onClick={onClose} />
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className={cn(
            'no-scrollbar flex h-full snap-x snap-mandatory',
            isZoomed ? 'overflow-hidden' : 'overflow-x-auto',
          )}
        >
          {images.map((image, i) => (
            <div
              key={`${i}-${image.url}`}
              className="relative h-full w-full shrink-0 snap-center overflow-auto [touch-action:pan-x_pan-y_pinch-zoom] lg:px-20"
              onDoubleClick={() => setIsZoomed((zoomed) => !zoomed)}
            >
              <div
                className={cn(
                  'relative h-full w-full transition-transform duration-medium ease-ios',
                  i === index && isZoomed ? 'scale-200 cursor-zoom-out' : 'cursor-zoom-in',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority={i === startAt}
                />
              </div>
            </div>
          ))}
        </div>
        {total > 1 ? (
          <>
            <IconButton
              name="caret-left"
              tone="glass"
              isDirectional
              label={t('detail.photoPrevious')}
              className="absolute inset-y-0 start-5 my-auto hidden lg:inline-flex"
              onClick={() => select(index - 1)}
            />
            <IconButton
              name="caret-right"
              tone="glass"
              isDirectional
              label={t('detail.photoNext')}
              className="absolute inset-y-0 end-5 my-auto hidden lg:inline-flex"
              onClick={() => select(index + 1)}
            />
          </>
        ) : null}
      </div>

      <p className="flex shrink-0 items-center justify-center gap-2 px-4 pt-3 text-xs text-on-photo/75">
        <Icon name="search" size={14} />
        {t('gallery.hint')}
      </p>
      {total > 1 ? (
        <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          {images.map((image, i) => (
            <button
              key={`lb-${i}`}
              type="button"
              onClick={() => select(i)}
              aria-label={t('detail.photoShow', { index: i + 1, total })}
              aria-current={i === index}
              className={cn(
                'relative size-14 shrink-0 overflow-hidden rounded-[14px] border border-glass-line',
                i === index ? 'ring-2 ring-gold' : 'opacity-60',
              )}
            >
              <Image src={image.thumbUrl} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </dialog>
  );
}
