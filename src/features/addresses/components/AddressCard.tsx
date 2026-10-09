'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardContent, Badge } from '@shared/components/ui';
import { getErrorCode, isolatePhone } from '@shared/lib';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useAddressesTranslation } from '../hooks/useAddressesTranslation';
import { AddressForm } from './AddressForm';
import type { Address } from '../types/addresses.types';

export interface AddressCardProps {
  address: Address;
}

export function AddressCard({ address }: AddressCardProps) {
  const { t } = useAddressesTranslation();
  const { t: tCommon } = useTranslation('common');
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view');
  const deleteAddress = useDeleteAddress();
  const errorCode = getErrorCode(deleteAddress.error);

  if (mode === 'edit') {
    return (
      <Card>
        <CardContent>
          <AddressForm address={address} onDone={() => setMode('view')} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">{address.label}</p>
          {address.isDefault ? <Badge tone="live">{t('list.default')}</Badge> : null}
        </div>
        <p className="text-sm text-foreground-soft">
          {[address.area, address.city, address.street].filter(Boolean).join(', ')}
        </p>
        {address.details ? (
          <p className="text-sm text-muted-foreground">{address.details}</p>
        ) : null}
        {address.contactPhone ? (
          <p className="text-sm text-muted-foreground">{isolatePhone(address.contactPhone)}</p>
        ) : null}

        {errorCode ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setMode('edit')}>
            {t('list.edit')}
          </Button>
          {mode === 'confirmDelete' ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                isLoading={deleteAddress.isPending}
                onClick={() =>
                  deleteAddress.mutate(address.id, { onSuccess: () => setMode('view') })
                }
              >
                {t('list.confirmDelete')}
              </Button>
              <Button variant="plain" size="sm" onClick={() => setMode('view')}>
                {t('form.cancel')}
              </Button>
            </>
          ) : (
            <Button variant="plain" size="sm" onClick={() => setMode('confirmDelete')}>
              {t('list.delete')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
