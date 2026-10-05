'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useServerClock } from '@shared/hooks';
import { authApi } from '../api/auth.api';
import type { OtpRequestResult } from '../types/auth.types';

/** mazad-api refuses another code for the same phone and purpose within 60s (OTP_RESEND_COOLDOWN). */
export const OTP_RESEND_COOLDOWN_MS = 60_000;

export interface SentSignupCode {
  phone: string;
  result: OtpRequestResult;
  /** ISO time the resend button unlocks, on the server clock like every countdown (ADR-013). */
  resendAvailableAt: string;
}

/** Requests (and re-requests) the SIGNUP code. It never creates an account by itself. */
export function useSignupOtp() {
  const { now } = useServerClock();
  const [sent, setSent] = useState<SentSignupCode | null>(null);

  const mutation = useMutation({
    mutationFn: (phone: string) => authApi.requestOtp(phone, 'SIGNUP'),
    onSuccess: (result, phone) => {
      setSent({
        phone,
        result,
        resendAvailableAt: new Date(now() + OTP_RESEND_COOLDOWN_MS).toISOString(),
      });
    },
  });

  const reset = () => {
    setSent(null);
    mutation.reset();
  };

  return { sent, request: mutation.mutate, mutation, reset };
}
