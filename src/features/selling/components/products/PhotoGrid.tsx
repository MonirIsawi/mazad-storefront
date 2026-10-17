'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { FIELD_LABEL, Icon, Spinner } from '@shared/components/ui';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';

/** Photos first (design `.uploader`): a four-up grid of square tiles, the cover marked. */
export function PhotoGrid({
  children,
  error,
  input,
}: {
  children: ReactNode;
  error?: ReactNode;
  /** The hidden file input the add tile opens. */
  input: ReactNode;
}) {
  const { t } = useSellingTranslation();
  return (
    <section className="grid gap-2" aria-labelledby="product-photos">
      <h2 id="product-photos" className={FIELD_LABEL}>
        {t('fields.photos')}
      </h2>
      <ul className="grid grid-cols-4 gap-2.5">{children}</ul>
      {input}
      <p className="text-[12.5px] text-muted-foreground">{t('products.coverHint')}</p>
      {error}
    </section>
  );
}

export function PhotoTile({
  url,
  isCover,
  isRemoving = false,
  onRemove,
}: {
  url: string | null;
  isCover: boolean;
  isRemoving?: boolean;
  onRemove: () => void;
}) {
  const { t } = useSellingTranslation();
  return (
    <li className="relative aspect-square overflow-hidden rounded-[18px] border border-border bg-surface-raised">
      {url ? (
        <Image
          src={url}
          alt=""
          fill
          // A photo picked but not uploaded yet is a local blob: nothing to optimise.
          unoptimized={url.startsWith('blob:')}
          sizes="(min-width: 960px) 200px, 25vw"
          className="object-cover"
        />
      ) : null}
      {isCover ? (
        <span className="absolute start-1.5 bottom-1.5 inline-flex h-[22px] items-center rounded-full bg-[rgb(12_11_10/60%)] px-2 text-[11px] font-semibold text-on-photo">
          {t('fields.coverPhoto')}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={t('fields.removePhoto')}
        disabled={isRemoving}
        onClick={onRemove}
        className="absolute end-1 top-1 grid size-8 place-items-center rounded-full border border-[rgb(255_245_225/16%)] bg-[rgb(20_17_13/60%)] text-on-photo backdrop-blur-[8px] disabled:opacity-50"
      >
        {isRemoving ? <Spinner size={14} /> : <Icon name="x" size={14} />}
      </button>
    </li>
  );
}

export function AddPhotoTile({ isBusy, onClick }: { isBusy: boolean; onClick: () => void }) {
  const { t } = useSellingTranslation();
  return (
    <li>
      <button
        type="button"
        disabled={isBusy}
        onClick={onClick}
        className="grid aspect-square w-full place-items-center content-center gap-1 rounded-[18px] border-[1.5px] border-dashed border-gold-line bg-gold-soft text-gold disabled:opacity-60 light:text-gold-lo"
      >
        {isBusy ? <Spinner size={20} /> : <Icon name="camera" size={22} />}
        <span className="text-[11.5px] font-medium">{t('fields.addPhoto')}</span>
      </button>
    </li>
  );
}
