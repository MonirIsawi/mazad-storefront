'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { RegisterForm } from '../components/RegisterForm';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

export function RegisterPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-gutter py-12">
      <h1 className="text-2xl font-bold text-foreground">{t('register.title')}</h1>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link href={ROUTES.login} className="font-medium text-accent hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  );
}
