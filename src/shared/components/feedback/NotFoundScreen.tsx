'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { buttonVariants } from '@shared/components/ui';
import { EmptyState } from './EmptyState';

/** The app's 404 (design not-found): what happened, and two ways on (browse, or home). */
export function NotFoundScreen() {
  const { t } = useTranslation('common');
  return (
    <div
      className="mx-auto flex min-h-[60dvh] w-full max-w-page flex-col justify-center px-5 pt-16 lg:px-10 lg:pt-0"
      data-testid="not-found"
    >
      <EmptyState
        icon="magnifying-glass-minus"
        title={t('notFound.title')}
        titleAs="h1"
        message={t('notFound.message')}
        action={<RecoveryLinks />}
      />
    </div>
  );
}

/** Browse (the way on, gold) and Home, the same pair on the 404 and the error screen. */
export function RecoveryLinks({ isQuiet = false }: { isQuiet?: boolean }) {
  const { t } = useTranslation('common');
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-2.5">
      <Link
        href={ROUTES.auctions}
        className={buttonVariants({
          variant: isQuiet ? 'soft' : 'gold',
          size: isQuiet ? 'sm' : 'md',
        })}
      >
        {t('recovery.browse')}
      </Link>
      <Link
        href={ROUTES.home}
        className={buttonVariants({ variant: 'soft', size: isQuiet ? 'sm' : 'md' })}
      >
        {t('recovery.home')}
      </Link>
    </div>
  );
}
