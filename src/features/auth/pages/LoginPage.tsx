'use client';

import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { LegalLinks } from '../components/LegalLinks';
import { LoginForm } from '../components/LoginForm';
import { AuthShell } from '../components/shell/AuthShell';
import { AuthHeading } from '../components/shell/AuthHeading';
import { AuthSwitchLine } from '../components/shell/AuthSwitchLine';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

export function LoginPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <AuthShell backHref={ROUTES.home}>
      <AuthHeading title={t('login.title')} intro={t('login.intro')} />
      <LoginForm />
      <AuthSwitchLine
        question={t('login.noAccount')}
        linkLabel={t('login.createAccount')}
        href={ROUTES.register}
      />
      <LegalLinks />
    </AuthShell>
  );
}
