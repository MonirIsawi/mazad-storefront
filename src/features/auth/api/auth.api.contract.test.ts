// @vitest-environment node
// Node, not jsdom: jsdom's XHR enforces CORS against the API's browser origin allow-list.
import { describe, expect, it } from 'vitest';
import { getErrorCode } from '@shared/lib';

/*
 * Opt-in contract check against a running mazad-api (skipped in the normal suite). It drives the
 * real authApi and httpClient — no mocks — so a drift in the sign-up contract or in the refresh
 * flow shows up here. Run it against an API started with OTP_DEV_MODE and a known static code:
 *
 *   MAZAD_API_CONTRACT_URL=http://localhost:3001/api/v1 MAZAD_API_CONTRACT_OTP=111111 \
 *     npx vitest run src/features/auth/api/auth.api.contract.test.ts
 *
 * It creates throwaway users named "Contract Test".
 */
const API_URL = process.env.MAZAD_API_CONTRACT_URL;
const DEV_CODE = process.env.MAZAD_API_CONTRACT_OTP ?? '';

const newPhone = () => `+96479${Date.now().toString().slice(-8)}`;

async function loadClient() {
  process.env.NEXT_PUBLIC_API_URL = API_URL;
  const [{ authApi }, sharedApi] = await Promise.all([import('./auth.api'), import('@shared/api')]);
  return { authApi, ...sharedApi };
}

async function codeOf(promise: Promise<unknown>) {
  return promise.then(
    () => 'RESOLVED',
    (error: unknown) => getErrorCode(error),
  );
}

describe.skipIf(!API_URL)('auth contract with a live mazad-api', () => {
  it('signs up through a SIGNUP OTP exactly as RegisterForm does', async () => {
    const { authApi } = await loadClient();
    const phone = newPhone();
    const details = { fullName: 'Contract Test', phone, password: 'ContractPass1!' };

    const sent = await authApi.requestOtp(phone, 'SIGNUP');
    expect(sent.delivered).toBe(true);

    expect(await codeOf(authApi.requestOtp(phone, 'SIGNUP'))).toBe('OTP_RESEND_COOLDOWN');
    expect(await codeOf(authApi.register({ ...details, code: '000000' }))).toBe('OTP_INVALID');

    const account = await authApi.register({ ...details, code: DEV_CODE });
    expect(account.user.phone).toBe(phone);
    expect(account.accessToken).toBeTruthy();

    // The code is consumed and the phone is now taken.
    expect(await codeOf(authApi.register({ ...details, code: DEV_CODE }))).toBe('PHONE_EXISTS');
  });

  it('refuses registration for a phone that never received a code', async () => {
    const { authApi } = await loadClient();
    const phone = newPhone();
    const result = await codeOf(
      authApi.register({
        fullName: 'Contract Test',
        phone,
        password: 'ContractPass1!',
        code: DEV_CODE,
      }),
    );
    expect(result).toBe('OTP_EXPIRED_OR_MISSING');
  });

  it('resets a password through a PASSWORD_RESET code exactly as ResetPasswordForm does', async () => {
    const { authApi } = await loadClient();
    const phone = newPhone();
    await authApi.requestOtp(phone, 'SIGNUP');
    await authApi.register({
      fullName: 'Contract Test',
      phone,
      password: 'ContractPass1!',
      code: DEV_CODE,
    });

    expect((await authApi.requestOtp(phone, 'PASSWORD_RESET')).delivered).toBe(true);
    expect(await codeOf(authApi.verifyResetCode(phone, '000000'))).toBe('OTP_INVALID');
    const { resetToken } = await authApi.verifyResetCode(phone, DEV_CODE);
    await authApi.resetPassword(resetToken, 'ResetPass2!');

    // Single use; the old password is gone and the new one signs in.
    expect(await codeOf(authApi.resetPassword(resetToken, 'Another3!'))).toBe(
      'RESET_TOKEN_INVALID',
    );
    expect(await codeOf(authApi.login({ phone, password: 'ContractPass1!' }))).toBe(
      'INVALID_CREDENTIALS',
    );
    expect((await authApi.login({ phone, password: 'ResetPass2!' })).user.phone).toBe(phone);
  });

  it('tells a reset for a number without an account apart', async () => {
    const { authApi } = await loadClient();
    const phone = newPhone();
    await authApi.requestOtp(phone, 'PASSWORD_RESET');
    expect(await codeOf(authApi.verifyResetCode(phone, DEV_CODE))).toBe('USER_NOT_FOUND');
  });

  it('refreshes once for concurrent 401s and keeps the session alive', async () => {
    const { authApi, httpClient, setSessionTokens, getSessionTokens } = await loadClient();
    const phone = newPhone();
    await authApi.requestOtp(phone, 'SIGNUP');
    const account = await authApi.register({
      fullName: 'Contract Test',
      phone,
      password: 'ContractPass1!',
      code: DEV_CODE,
    });

    // An access token the API refuses, with a valid refresh token: every call gets a 401.
    setSessionTokens({ accessToken: 'expired.access.token', refreshToken: account.refreshToken });
    const responses = await Promise.all([
      httpClient.get('/me'),
      httpClient.get('/me/addresses'),
      httpClient.get('/me'),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);

    // Had the three requests each sent the refresh token, the API would have detected reuse and
    // revoked the session (REFRESH_TOKEN_REUSE); the rotated tokens still work.
    const rotated = getSessionTokens();
    expect(rotated?.refreshToken).not.toBe(account.refreshToken);
    await expect(httpClient.get('/me')).resolves.toMatchObject({ status: 200 });
    setSessionTokens(null);
  });
});
