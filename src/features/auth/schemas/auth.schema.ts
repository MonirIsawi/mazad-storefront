import { z } from 'zod';
import { parsePhone } from '@shared/lib/phone';

// Anything mazad-api reads as a phone: 07…, +964…, Arabic digits, spaces and dashes included.
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => parsePhone(value) !== null, 'errors.field.phoneInvalid');

const passwordSchema = z.string().min(8, 'errors.field.passwordMin');

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

/** mazad-api sends 6-digit codes (OTP_LENGTH); keep this and the pattern below in step. */
export const OTP_CODE_LENGTH = 6;

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'errors.field.otpInvalid');

/** Sign-up needs a SIGNUP code for the same phone (POST /auth/otp/request) before the account exists. */
export const registerSchema = z.object({
  phone: phoneSchema,
  fullName: z.string().trim().min(2, 'errors.field.fullNameMin'),
  password: passwordSchema,
  code: otpCodeSchema,
});

/**
 * Password reset, one form in three steps (docs/api/authentication.md, "Password reset"):
 * phone → PASSWORD_RESET code → new password. mazad-api accepts 8–128 characters.
 */
export const resetPasswordSchema = z
  .object({
    phone: phoneSchema,
    code: otpCodeSchema,
    newPassword: passwordSchema.max(128, 'errors.field.passwordMax'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    path: ['confirmPassword'],
    message: 'errors.field.passwordMismatch',
  });

/** POST /auth/otp/verify with purpose PASSWORD_RESET: a single-use reset token, never a session. */
export const resetTokenResultSchema = z.object({
  resetToken: z.string().regex(/^[a-f0-9]{64}$/),
  resetTokenExpiresAt: z.string(),
});

/**
 * The delete-account confirmation. The password stays optional because the API does not tell the
 * client whether the account has one (a phone-code sign-up has none); the API decides.
 */
export const deleteAccountSchema = z.object({
  password: z.string().max(200),
  isConfirmed: z.boolean(),
});

export const otpPurposeSchema = z.enum(['SIGNUP', 'LOGIN', 'PASSWORD_RESET']);

// POST /auth/otp/request. When the phone isn't linked to the Telegram bot yet, `delivered` is
// false and the code only arrives after the user opens the bot through `telegramDeepLink`.
export const otpRequestResultSchema = z.object({
  expiresAt: z.string(),
  delivered: z.boolean(),
  telegramDeepLink: z
    .string()
    .regex(/^https:\/\/t\.me\//)
    .optional(),
});

// mazad-api's sanitizeUser() returns the full User row minus passwordHash; only the fields the
// UI actually renders are modeled here — Zod silently drops the rest (banReason, timestamps, ...).
export const authUserSchema = z.object({
  id: z.string(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  phone: z.string().nullable(),
  fullName: z.string(),
  isVerified: z.boolean(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  sessionId: z.string(),
});

export const authResponseSchema = authTokensSchema.extend({
  user: authUserSchema,
});
