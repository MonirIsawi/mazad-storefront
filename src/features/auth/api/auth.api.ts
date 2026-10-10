import { httpClient } from '@shared/api';
import { normalizePhone } from '@shared/lib/phone';
import {
  authResponseSchema,
  authUserSchema,
  otpRequestResultSchema,
  resetTokenResultSchema,
} from '../schemas/auth.schema';
import type {
  AuthResponse,
  AuthUser,
  LoginValues,
  OtpPurpose,
  OtpRequestResult,
  RegisterValues,
  ResetTokenResult,
} from '../types/auth.types';

export const authApi = {
  requestOtp: async (phone: string, purpose: OtpPurpose): Promise<OtpRequestResult> => {
    const response = await httpClient.post<unknown>('/auth/otp/request', {
      phone: normalizePhone(phone),
      purpose,
    });
    return otpRequestResultSchema.parse(response.data);
  },

  /** `values.code` is the SIGNUP code; the API verifies and consumes it before creating the user. */
  register: async (values: RegisterValues): Promise<AuthResponse> => {
    const response = await httpClient.post<unknown>('/auth/register', {
      ...values,
      phone: normalizePhone(values.phone),
      platform: 'web',
    });
    return authResponseSchema.parse(response.data);
  },

  login: async (values: LoginValues): Promise<AuthResponse> => {
    // Canonical +9647… however it was typed (07…, Arabic digits); the API reads the same forms.
    const response = await httpClient.post<unknown>('/auth/login', {
      ...values,
      phone: normalizePhone(values.phone),
      platform: 'web',
    });
    return authResponseSchema.parse(response.data);
  },

  /** PASSWORD_RESET: the API verifies and consumes the code and returns a reset token, not a session. */
  verifyResetCode: async (phone: string, code: string): Promise<ResetTokenResult> => {
    const response = await httpClient.post<unknown>('/auth/otp/verify', {
      phone: normalizePhone(phone),
      code,
      purpose: 'PASSWORD_RESET',
    });
    return resetTokenResultSchema.parse(response.data);
  },

  /** Sets the new password and revokes every session of the account; nobody is signed in. */
  resetPassword: async (resetToken: string, newPassword: string): Promise<void> => {
    await httpClient.post('/auth/password/reset', { resetToken, newPassword });
  },

  logout: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },

  me: async (): Promise<AuthUser> => {
    const response = await httpClient.get<unknown>('/me');
    return authUserSchema.parse(response.data);
  },

  /**
   * DELETE /me: closes the account and revokes every session. The API rejects any body field but
   * `password`, which is sent only when the user typed one (a passwordless account has none).
   */
  deleteAccount: async (password?: string): Promise<void> => {
    await httpClient.delete('/me', { data: password ? { password } : {} });
  },
};
