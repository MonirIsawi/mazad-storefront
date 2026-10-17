'use client';

import { useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import { AddPhotoTile, PhotoGrid, PhotoTile } from './PhotoGrid';

/**
 * Photos first on a new product: picked before the product exists and kept in the page until
 * Save, which creates the product and then uploads them in order (the first becomes the cover).
 * Images can only be attached to a saved product (`/products/:id/images`).
 */
export function PendingPhotos({
  files,
  onChange,
  isBusy,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  isBusy: boolean;
}) {
  const { t } = useSellingTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length > 0) onChange([...files, ...picked]);
    event.target.value = '';
  };

  return (
    <PhotoGrid
      error={
        files.length > 0 ? (
          <p className="text-[12.5px] text-muted-foreground">{t('products.pendingPhotosHint')}</p>
        ) : null
      }
      input={
        <input
          ref={inputRef}
          type="file"
          multiple
          // Matches mazad-api's ALLOWED_MIMES; anything else is rejected with INVALID_FILE_TYPE.
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={handleChange}
        />
      }
    >
      {previews.map((url, index) => (
        <PhotoTile
          key={url}
          url={url}
          isCover={index === 0}
          onRemove={() => onChange(files.filter((_, at) => at !== index))}
        />
      ))}
      <AddPhotoTile isBusy={isBusy} onClick={() => inputRef.current?.click()} />
    </PhotoGrid>
  );
}
