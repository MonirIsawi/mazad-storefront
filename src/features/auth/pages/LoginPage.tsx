'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { LoginForm } from '../components/LoginForm';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

export function LoginPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-gutter py-12">
      <h1 className="text-2xl font-bold text-foreground">{t('login.title')}</h1>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link href={ROUTES.register} className="font-medium text-accent hover:underline">
          {t('login.createAccount')}
        </Link>
      </p>
    </div>
  );
}
