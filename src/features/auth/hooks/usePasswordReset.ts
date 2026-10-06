'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getSessionTokens } from '@shared/api';
import { ROUTES } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useAuthTranslation } from './useAuthTranslation';

/**
 * The last two steps of the reset (the code request is useSignupOtp('PASSWORD_RESET')):
 * the code buys a single-use reset token, the token sets the new password.
 *
 * Saving revokes every session of the account, this browser's included, and signs nobody in.
 * A session still held here is dropped locally, and the user signs in with the new password.
 */
export function usePasswordReset() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { t } = useAuthTranslation();

  const verify = useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyResetCode(phone, code),
  });

  const save = useMutation({
    mutationFn: ({ resetToken, newPassword }: { resetToken: string; newPassword: string }) =>
      authApi.resetPassword(resetToken, newPassword),
    onSuccess: () => {
      if (getSessionTokens()) {
        clearSession();
        queryClient.clear();
      }
      toast.success(t('reset.done'));
      router.replace(ROUTES.login);
    },
  });

  return { verify, save };
}
