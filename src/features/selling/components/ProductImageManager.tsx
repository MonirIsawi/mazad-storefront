'use client';

import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorCode, resolveThumbUrl } from '@shared/lib';
import { useAddProductImage, useRemoveProductImage } from '../hooks/useProducts';
import { useSellingTranslation } from '../hooks/useSellingTranslation';
import type { SellerProduct } from '../types/selling.types';
import { AddPhotoTile, PhotoGrid, PhotoTile } from './products/PhotoGrid';

/**
 * Photos are managed against a saved product, not collected alongside the form: both endpoints
 * are `/products/:id/images`, so there is no id to attach an upload to until the product exists.
 * The editor therefore only shows this once the product has been created.
 */
export function ProductImageManager({ product }: { product: SellerProduct }) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const addImage = useAddProductImage();
  const removeImage = useRemoveProductImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const errorCode = getErrorCode(addImage.error) ?? getErrorCode(removeImage.error);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addImage.mutate({
      productId: product.id,
      file,
      // The first photo becomes the cover, which is what the auction grid renders.
      isCover: product.images.length === 0,
    });
    // Clears the input so picking the same file twice still fires a change event.
    event.target.value = '';
  };

  return (
    <PhotoGrid
      error={
        errorCode ? (
          <p role="alert" className="text-[12.5px] text-destructive">
            {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
          </p>
        ) : null
      }
      input={
        <input
          ref={fileInputRef}
          type="file"
          // Matches mazad-api's ALLOWED_MIMES; anything else is rejected with INVALID_FILE_TYPE.
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={handleFileChange}
        />
      }
    >
      {product.images.map((image) => (
        <PhotoTile
          key={image.id}
          url={resolveThumbUrl(image.thumbUrl ?? image.url)}
          isCover={image.isCover}
          isRemoving={removeImage.isPending && removeImage.variables?.imageId === image.id}
          onRemove={() => removeImage.mutate({ productId: product.id, imageId: image.id })}
        />
      ))}
      <AddPhotoTile isBusy={addImage.isPending} onClick={() => fileInputRef.current?.click()} />
    </PhotoGrid>
  );
}
