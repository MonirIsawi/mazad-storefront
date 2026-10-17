'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FIELD_LABEL, Icon } from '@shared/components/ui';
import { getErrorCode, resolveAssetUrl } from '@shared/lib';
import { useStoreCover } from '../../hooks/useStores';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { Store } from '../../types/selling.types';

/**
 * The store's cover photo (PATCH /me/stores/:id { coverKey }), uploaded the way product photos
 * are. Only rendered for an API that has store covers (`store.supportsCover`).
 */
export function StoreCoverControl({ store }: { store: Store }) {
  const { t } = useSellingTranslation();
  const { t: tCommon } = useTranslation('common');
  const cover = useStoreCover();
  const inputRef = useRef<HTMLInputElement>(null);
  const url = resolveAssetUrl(store.coverUrl);
  const errorCode = getErrorCode(cover.error);

  return (
    <section className="grid gap-2" aria-labelledby="store-cover">
      <h3 id="store-cover" className={FIELD_LABEL}>
        {t('stores.cover')}
      </h3>
      <div className="relative grid aspect-[16/6] place-items-center overflow-hidden rounded-[18px] border border-border bg-background-deep text-muted-foreground">
        {url ? (
          <Image src={url} alt="" fill sizes="520px" className="object-cover" />
        ) : (
          <Icon name="camera" size={26} />
        )}
      </div>
      <p className="text-[12.5px] text-muted-foreground">{t('stores.coverHint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="soft"
          size="sm"
          isLoading={cover.isPending && cover.variables?.file != null}
          onClick={() => inputRef.current?.click()}
        >
          {t(url ? 'stores.coverChange' : 'stores.coverAdd')}
        </Button>
        {url ? (
          <Button
            variant="plain"
            size="sm"
            isLoading={cover.isPending && cover.variables?.file == null}
            onClick={() => cover.mutate({ storeId: store.id, file: null })}
          >
            {t('stores.coverRemove')}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        // Matches mazad-api's ALLOWED_MIMES; anything else is rejected with INVALID_FILE_TYPE.
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) cover.mutate({ storeId: store.id, file });
          event.target.value = '';
        }}
      />
      {errorCode ? (
        <p role="alert" className="text-[12.5px] text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
    </section>
  );
}
