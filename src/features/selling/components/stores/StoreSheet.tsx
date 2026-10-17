'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmDialog, Icon, Sheet } from '@shared/components/ui';
import { getErrorCode } from '@shared/lib';
import { useDeleteStore } from '../../hooks/useStores';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import type { Store } from '../../types/selling.types';
import { StoreForm } from '../StoreForm';
import { StoreCoverControl } from './StoreCoverControl';

/**
 * A store's editor in a sheet (a dialog from 960px): the cover when the API has covers, the
 * details, and Delete for any store but the default one (DEFAULT_STORE_PROTECTED).
 */
export function StoreSheet({
  store,
  isOpen,
  onClose,
}: {
  /** Absent for a new store. */
  store?: Store;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useSellingTranslation();
  const deleteStore = useDeleteStore();
  const { t: tCommon } = useTranslation('common');
  const [isAsking, setIsAsking] = useState(false);
  const deleteError = getErrorCode(deleteStore.error);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={t(store ? 'stores.editTitle' : 'stores.newTitle')}
      width="lg"
    >
      {store?.supportsCover ? <StoreCoverControl store={store} /> : null}
      {/* Keyed so reopening starts from the store's saved values. */}
      {isOpen ? <StoreForm key={store?.id ?? 'new'} store={store} onDone={onClose} /> : null}
      {store && !store.isDefault ? (
        <>
          <Button variant="dangerLine" size="sm" onClick={() => setIsAsking(true)}>
            <Icon name="trash" size={16} />
            {t('stores.delete')}
          </Button>
          {deleteError ? (
            <p role="alert" className="text-[12.5px] text-destructive">
              {t(`errors.${deleteError}`, { defaultValue: tCommon('errors.generic') })}
            </p>
          ) : null}
          <ConfirmDialog
            isOpen={isAsking}
            tone="danger"
            title={t('stores.deleteTitle')}
            body={t('stores.deleteConfirm')}
            confirmLabel={t('stores.delete')}
            isPending={deleteStore.isPending}
            onCancel={() => setIsAsking(false)}
            onConfirm={() =>
              deleteStore.mutate(store.id, {
                onSuccess: onClose,
                onSettled: () => setIsAsking(false),
              })
            }
          />
        </>
      ) : null}
    </Sheet>
  );
}
