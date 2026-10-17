'use client';

import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
import { AuthShell } from '../components/shell/AuthShell';
import { AuthSwitchLine } from '../components/shell/AuthSwitchLine';
import { useAuthTranslation } from '../hooks/useAuthTranslation';

/** Phone, code, new password: three steps, the current one named in words over the bar. */
export function ResetPasswordPage() {
  const { t, isReady } = useAuthTranslation();

  if (!isReady) return <PageLoader />;

  return (
    <AuthShell backHref={ROUTES.login}>
      <ResetPasswordForm />
      <AuthSwitchLine
        question={t('reset.remembered')}
        linkLabel={t('register.signIn')}
        href={ROUTES.login}
      />
    </AuthShell>
  );
}
