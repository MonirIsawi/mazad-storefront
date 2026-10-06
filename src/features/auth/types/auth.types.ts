import type { z } from 'zod';
import type {
  loginSchema,
  registerSchema,
  authUserSchema,
  authTokensSchema,
  authResponseSchema,
  otpPurposeSchema,
  otpRequestResultSchema,
  deleteAccountSchema,
} from '../schemas/auth.schema';

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type OtpPurpose = z.infer<typeof otpPurposeSchema>;
export type OtpRequestResult = z.infer<typeof otpRequestResultSchema>;
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
