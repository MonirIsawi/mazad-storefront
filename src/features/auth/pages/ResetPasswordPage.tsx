'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

export function ResetPasswordPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-gutter py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{t('reset.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reset.intro')}</p>
      </div>
      <ResetPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        {t('reset.remembered')}{' '}
        <Link href={ROUTES.login} className="font-medium text-accent hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
