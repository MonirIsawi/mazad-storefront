'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader, ErrorState } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Card, StateBanner } from '@shared/components/ui';
import { useAddresses } from '../hooks/useAddresses';
import { useAddressesTranslation } from '../hooks/useAddressesTranslation';
import { AddressList } from '../components/AddressList';
import { AddressForm } from '../components/AddressForm';

/**
 * Delivery addresses (design `addresses`). Bidding needs at least one, and the page opens by saying
 * so; deleting asks inline on the card; the add form is open below the list (beside it on desktop).
 */
export function AddressesPage() {
  const { t, isReady } = useAddressesTranslation();
  const { data: addresses, isPending, isError, refetch } = useAddresses();
  // A fresh, empty form after each address is added.
  const [formKey, setFormKey] = useState(0);

  if (!isReady || isPending) return <PageLoader />;
  if (isError || !addresses) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  return (
    <>
      <ScreenHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('page.account'), href: ROUTES.account }]}
      />
      <PageContainer className="pb-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <div className="grid gap-3">
            <StateBanner tone={addresses.length ? 'info' : 'warn'} icon="info" className="text-sm">
              {addresses.length ? t('page.winNote') : t('page.subtitle')}
            </StateBanner>
            <AddressList addresses={addresses} />
          </div>
          <Card isInset className="grid gap-4">
            <h2 className="text-h3 font-medium text-foreground">{t('form.newTitle')}</h2>
            <AddressForm key={formKey} onDone={() => setFormKey((key) => key + 1)} />
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
