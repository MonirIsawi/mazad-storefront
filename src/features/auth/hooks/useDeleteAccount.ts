'use client';

import { flushSync } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@shared/constants';
import { useToast } from '@shared/hooks';
import { getErrorStatus } from '@shared/lib';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { useAuthTranslation } from './useAuthTranslation';

export function useDeleteAccount() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { t } = useAuthTranslation();

  // Local sign-out only. The API has already revoked every session of this account, so
  // POST /auth/logout (what useLogout calls) could only answer 401.
  //
  // flushSync: clearing the session makes AuthGuard redirect to the login screen from an effect.
  // Committing that render now lets that redirect run first, so a navigation issued after this
  // call is the one that wins.
  function endLocalSession() {
    flushSync(() => clearSession());
    queryClient.clear();
  }

  return useMutation({
    mutationFn: (password?: string) => authApi.deleteAccount(password),
    onSuccess: () => {
      endLocalSession();
      toast.success(t('deleteAccount.deleted'));
      router.replace(ROUTES.home);
    },
    onError: (error) => {
      // The session was already gone (e.g. the account was deleted from another device). The
      // http client signs out when the refresh is refused; this covers the rest, and AuthGuard
      // then sends the user to sign in.
      if (getErrorStatus(error) === 401) endLocalSession();
    },
  });
}
