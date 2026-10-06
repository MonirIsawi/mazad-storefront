import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@shared/api';
import { authApi } from './auth.api';

vi.mock('@shared/api', () => ({
  httpClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

const post = vi.mocked(httpClient.post);

beforeEach(() => {
  post.mockReset();
});

describe('authApi sign-up contract', () => {
  it('requests a SIGNUP code with only phone and purpose', async () => {
    post.mockResolvedValue({
      data: {
        message: 'sent',
        expiresAt: '2030-01-01T00:05:00.000Z',
        channel: 'TELEGRAM',
        delivered: false,
        telegramDeepLink: 'https://t.me/mazad_bot?start=abc',
        botUsername: 'mazad_bot',
      },
    });

    const result = await authApi.requestOtp('+9647701234567', 'SIGNUP');

    expect(post).toHaveBeenCalledWith('/auth/otp/request', {
      phone: '+9647701234567',
      purpose: 'SIGNUP',
    });
    expect(result).toEqual({
      expiresAt: '2030-01-01T00:05:00.000Z',
      delivered: false,
      telegramDeepLink: 'https://t.me/mazad_bot?start=abc',
    });
  });

  it('refuses a deep link that is not a Telegram link', async () => {
    post.mockResolvedValue({
      data: {
        expiresAt: '2030-01-01T00:05:00.000Z',
        delivered: false,
        telegramDeepLink: 'https://evil.example',
      },
    });
    await expect(authApi.requestOtp('+9647701234567', 'SIGNUP')).rejects.toThrow();
  });

  it('sends the code with POST /auth/register', async () => {
    post.mockResolvedValue({
      data: {
        accessToken: 'a',
        refreshToken: 'r',
        sessionId: 's',
        user: {
          id: 'u1',
          role: 'CUSTOMER',
          phone: '+9647701234567',
          fullName: 'Ali',
          isVerified: false,
        },
      },
    });

    await authApi.register({
      fullName: 'Ali',
      phone: '+9647701234567',
      password: 'validpassword123',
      code: '123456',
    });

    expect(post).toHaveBeenCalledWith('/auth/register', {
      fullName: 'Ali',
      phone: '+9647701234567',
      password: 'validpassword123',
      code: '123456',
      platform: 'web',
    });
  });
});

describe('authApi account deletion contract', () => {
  const remove = vi.mocked(httpClient.delete);

  beforeEach(() => {
    remove.mockReset().mockResolvedValue({ data: { message: 'Account deleted' } });
  });

  it('sends only the password in the DELETE /me body', async () => {
    await authApi.deleteAccount('secret-pass');
    expect(remove).toHaveBeenCalledWith('/me', { data: { password: 'secret-pass' } });
  });

  it('sends an empty body when there is no password', async () => {
    await authApi.deleteAccount(undefined);
    await authApi.deleteAccount('');
    expect(remove.mock.calls).toEqual([
      ['/me', { data: {} }],
      ['/me', { data: {} }],
    ]);
  });
});

describe('authApi password reset contract', () => {
  const TOKEN = 'a'.repeat(64);

  it('verifies a PASSWORD_RESET code and returns only the reset token', async () => {
    post.mockResolvedValue({
      data: { resetToken: TOKEN, resetTokenExpiresAt: '2030-01-01T00:10:00.000Z' },
    });

    const result = await authApi.verifyResetCode('+9647701234567', '123456');

    expect(post).toHaveBeenCalledWith('/auth/otp/verify', {
      phone: '+9647701234567',
      code: '123456',
      purpose: 'PASSWORD_RESET',
    });
    expect(result).toEqual({ resetToken: TOKEN, resetTokenExpiresAt: '2030-01-01T00:10:00.000Z' });
  });

  it('refuses a response without a well-formed reset token (e.g. a session)', async () => {
    post.mockResolvedValue({ data: { accessToken: 'a', refreshToken: 'r', sessionId: 's' } });
    await expect(authApi.verifyResetCode('+9647701234567', '123456')).rejects.toThrow();
  });

  it('sends only the token and the new password', async () => {
    post.mockResolvedValue({ data: { message: 'Password updated' } });
    await authApi.resetPassword(TOKEN, 'NewPassword1!');
    expect(post).toHaveBeenCalledWith('/auth/password/reset', {
      resetToken: TOKEN,
      newPassword: 'NewPassword1!',
    });
  });
});
