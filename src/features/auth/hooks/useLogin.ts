'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { QUERY_KEYS, ROUTES } from '@shared/constants';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { withIraqiPrefix } from '../lib/phone-prefix';
import type { LoginValues } from '../types/auth.types';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: LoginValues) =>
      authApi.login({ ...values, phone: withIraqiPrefix(values.phone) }),
    onSuccess: (result) => {
      setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      queryClient.setQueryData(QUERY_KEYS.auth.me, result.user);
      router.replace(ROUTES.home);
    },
  });
}
