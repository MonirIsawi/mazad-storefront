'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { DeletionFactsCards } from '../components/DeletionFactsCards';
import { DeleteAccountForm } from '../components/DeleteAccountForm';

/**
 * Delete account (design `delete-account`): what must be closed first, what is deleted, what is
 * kept, and only then the button. Deleting is never one tap: password and "I understand" first.
 */
export function DeleteAccountPage() {
  const { t, isReady } = useAuthTranslation();
  const router = useRouter();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader
        title={t('deleteAccount.title')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('account.title'), href: ROUTES.account }]}
      />
      <PageContainer className="grid max-w-[820px] gap-3.5 pb-12">
        <p className="font-display text-[22px] leading-[1.4] text-foreground lg:text-[26px]">
          {t('deleteAccount.heading')}
        </p>
        <DeletionFactsCards />
        <DeleteAccountForm onCancel={() => router.push(ROUTES.account)} />
      </PageContainer>
    </>
  );
}
