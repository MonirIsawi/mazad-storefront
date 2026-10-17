'use client';

import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { LegalLinks } from '../components/LegalLinks';
import { RegisterForm } from '../components/RegisterForm';
import { AuthShell } from '../components/shell/AuthShell';
import { AuthSwitchLine } from '../components/shell/AuthSwitchLine';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/** Sign-up in two real steps (details, then the Telegram code); the form draws its own heading. */
export function RegisterPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <AuthShell backHref={ROUTES.home}>
      <RegisterForm />
      <AuthSwitchLine
        question={t('register.haveAccount')}
        linkLabel={t('register.signIn')}
        href={ROUTES.login}
      />
      <LegalLinks />
    </AuthShell>
  );
}
