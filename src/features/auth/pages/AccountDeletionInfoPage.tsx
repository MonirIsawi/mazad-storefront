'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { buttonVariants, Card } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { cn } from '@shared/lib';
import { DELETION_BLOCKERS } from '../lib/account-deletion';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

const STEPS = ['signIn', 'account', 'delete'] as const;
const AFTER = ['permanent', 'signedOut', 'phone'] as const;

/**
 * Public "how to delete your account" page (app stores require one reachable without signing in).
 * Information only, in the design's order: what must be closed first, what is deleted, what is
 * kept. The deletion itself happens on the signed-in delete-account screen.
 */
export function AccountDeletionInfoPage() {
  const { t, isReady } = useAuthTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader title={t('accountDeletion.title')} backHref={ROUTES.home} />
      <PageContainer className="grid max-w-[820px] gap-3.5 pb-12">
        <p className="text-[15px] leading-[1.7] text-foreground-soft">
          {t('accountDeletion.intro')}
        </p>

        <InfoCard title={t('accountDeletion.howTitle')}>
          <ol className="grid list-decimal gap-1.5 ps-5">
            {STEPS.map((step) => (
              <li key={step}>{t(`accountDeletion.steps.${step}`)}</li>
            ))}
          </ol>
          <p>{t('accountDeletion.passwordless')}</p>
        </InfoCard>

        <InfoCard title={t('accountDeletion.beforeTitle')}>
          <p>{t('accountDeletion.beforeIntro')}</p>
          <ul className="grid list-disc gap-1.5 ps-5">
            {DELETION_BLOCKERS.map((reason) => (
              <li key={reason}>{t(`deleteAccount.reasons.${reason}`)}</li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title={t('accountDeletion.deletedTitle')}>
          <p>{t('deleteAccount.consequences.removed')}</p>
        </InfoCard>

        <InfoCard title={t('accountDeletion.keptTitle')}>
          <p>{t('deleteAccount.consequences.kept')}</p>
        </InfoCard>

        <InfoCard title={t('accountDeletion.afterTitle')}>
          <ul className="grid list-disc gap-1.5 ps-5">
            {AFTER.map((key) => (
              <li key={key}>{t(`deleteAccount.consequences.${key}`)}</li>
            ))}
          </ul>
        </InfoCard>

        <Link
          href={isAuthenticated ? ROUTES.account : ROUTES.login}
          className={cn(buttonVariants({ isFullWidth: true, variant: 'gold' }), 'mt-4')}
        >
          {isAuthenticated ? t('accountDeletion.ctaSignedIn') : t('accountDeletion.ctaSignedOut')}
        </Link>
      </PageContainer>
    </>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card isInset className="grid gap-2.5 text-[14.5px] leading-[1.7] text-foreground-soft">
      <h2 className="text-h3 font-medium text-foreground">{title}</h2>
      {children}
    </Card>
  );
}
