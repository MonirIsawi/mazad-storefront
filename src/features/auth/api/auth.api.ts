import { httpClient } from '@shared/api';
import { authResponseSchema, authUserSchema, otpRequestResultSchema } from '../schemas/auth.schema';
import type {
  AuthResponse,
  AuthUser,
  LoginValues,
  OtpPurpose,
  OtpRequestResult,
  RegisterValues,
} from '../types/auth.types';

export const authApi = {
  requestOtp: async (phone: string, purpose: OtpPurpose): Promise<OtpRequestResult> => {
    const response = await httpClient.post<unknown>('/auth/otp/request', { phone, purpose });
    return otpRequestResultSchema.parse(response.data);
  },

  /** `values.code` is the SIGNUP code; the API verifies and consumes it before creating the user. */
  register: async (values: RegisterValues): Promise<AuthResponse> => {
    const response = await httpClient.post<unknown>('/auth/register', {
      ...values,
      platform: 'web',
    });
    return authResponseSchema.parse(response.data);
  },

  login: async (values: LoginValues): Promise<AuthResponse> => {
    const response = await httpClient.post<unknown>('/auth/login', { ...values, platform: 'web' });
    return authResponseSchema.parse(response.data);
  },

  logout: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },

  me: async (): Promise<AuthUser> => {
    const response = await httpClient.get<unknown>('/me');
    return authUserSchema.parse(response.data);
  },
};
