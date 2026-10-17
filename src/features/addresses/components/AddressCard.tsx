'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Icon } from '@shared/components/ui';
import { getErrorCode, isolatePhone, joinList } from '@shared/lib';
import { useLocale } from '@shared/hooks';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useAddressesTranslation } from '../hooks/useAddressesTranslation';
import { AddressForm } from './AddressForm';
import type { Address } from '../types/addresses.types';

export interface AddressCardProps {
  address: Address;
}

/** One saved address; edit opens the form in place, delete asks right on the card. */
export function AddressCard({ address }: AddressCardProps) {
  const { t } = useAddressesTranslation();
  const { t: tCommon } = useTranslation('common');
  const { locale } = useLocale();
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view');
  const deleteAddress = useDeleteAddress();
  const errorCode = getErrorCode(deleteAddress.error);

  if (mode === 'edit') {
    return (
      <Card isInset className="grid gap-4">
        <h2 className="text-h3 font-medium text-foreground">{t('form.editTitle')}</h2>
        <AddressForm address={address} onDone={() => setMode('view')} />
      </Card>
    );
  }

  return (
    <Card isInset tone={address.isDefault ? 'framed' : 'plain'} className="grid gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-medium text-foreground">
          <Icon name="house" size={18} className="text-gold" />
          {address.label}
        </h2>
        {address.isDefault ? <Badge tone="gold">{t('list.default')}</Badge> : null}
      </div>
      <p className="text-sm text-foreground-soft">
        {joinList([address.city, address.area, address.street], locale)}
        {address.details ? ` · ${address.details}` : ''}
      </p>
      {address.contactPhone ? (
        <p className="font-tabular text-xs text-muted-foreground">
          {isolatePhone(address.contactPhone)}
        </p>
      ) : null}
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      {mode === 'confirmDelete' ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive-soft px-3 py-2.5 text-sm font-medium text-destructive">
          <span className="flex-1">{t('list.deleteQuestion')}</span>
          <Button variant="soft" size="sm" onClick={() => setMode('view')}>
            {t('form.cancel')}
          </Button>
          <Button
            variant="dangerLine"
            size="sm"
            isLoading={deleteAddress.isPending}
            onClick={() => deleteAddress.mutate(address.id, { onSuccess: () => setMode('view') })}
          >
            {t('list.confirmDelete')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="soft" size="sm" onClick={() => setMode('edit')}>
            <Icon name="pencil" size={16} />
            {t('list.edit')}
          </Button>
          <Button variant="plain" size="sm" onClick={() => setMode('confirmDelete')}>
            <Icon name="trash" size={16} />
            {t('list.delete')}
          </Button>
        </div>
      )}
    </Card>
  );
}
