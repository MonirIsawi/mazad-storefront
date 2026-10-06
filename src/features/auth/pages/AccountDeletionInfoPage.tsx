'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { buttonVariants, Card } from '@shared/components/ui';
import { useIsAuthenticated } from '@shared/hooks';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

const STEPS = ['signIn', 'account', 'delete'] as const;
const BLOCKERS = [
  'SELLER_AUCTIONS_ACTIVE',
  'SELLER_ORDERS_OPEN',
  'SELLER_RETURN_WINDOW_OPEN',
  'BUYER_ORDERS_OPEN',
  'WINS_PENDING',
  'RETURNS_OPEN',
  'LEADING_BIDS',
  'WALLET_NOT_EMPTY',
] as const;
const AFTER = ['permanent', 'signedOut', 'phone'] as const;

/**
 * Public "how to delete your account" page (app stores require one reachable without signing in).
 * Information only: the deletion itself happens on the signed-in account screen.
 */
export function AccountDeletionInfoPage() {
  const { t, isReady } = useAuthTranslation();
  const isAuthenticated = useIsAuthenticated();

  if (!isReady) return <PageLoader />;

  return (
    <>
      <ScreenHeader title={t('accountDeletion.title')} backHref={ROUTES.home} />

      <div className="flex flex-col gap-4 px-gutter pb-6">
        <p className="text-subhead text-foreground-soft">{t('accountDeletion.intro')}</p>

        <InfoCard title={t('accountDeletion.howTitle')}>
          <ol className="flex list-decimal flex-col gap-1.5 ps-5">
            {STEPS.map((step) => (
              <li key={step}>{t(`accountDeletion.steps.${step}`)}</li>
            ))}
          </ol>
          <p>{t('accountDeletion.passwordless')}</p>
        </InfoCard>

        <InfoCard title={t('accountDeletion.beforeTitle')}>
          <p>{t('accountDeletion.beforeIntro')}</p>
          <ul className="flex list-disc flex-col gap-1.5 ps-5">
            {BLOCKERS.map((reason) => (
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
          <ul className="flex list-disc flex-col gap-1.5 ps-5">
            {AFTER.map((key) => (
              <li key={key}>{t(`deleteAccount.consequences.${key}`)}</li>
            ))}
          </ul>
        </InfoCard>

        <Link
          href={isAuthenticated ? ROUTES.account : ROUTES.login}
          className={buttonVariants({ size: 'lg', isFullWidth: true })}
        >
          {isAuthenticated ? t('accountDeletion.ctaSignedIn') : t('accountDeletion.ctaSignedOut')}
        </Link>
      </div>
    </>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card isInset className="flex flex-col gap-2 text-subhead text-foreground-soft">
      <h2 className="text-headline font-semibold text-foreground">{title}</h2>
      {children}
    </Card>
  );
}
