import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { getSessionTokens, setSessionTokens } from '@shared/api';
import { useToastStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { ResetPasswordForm } from './ResetPasswordForm';
import { authApi } from '../api/auth.api';
import authEn from '../i18n/en.json';
import authAr from '../i18n/ar.json';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../api/auth.api', () => ({
  authApi: {
    requestOtp: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

const PHONE = '+9647701234567';
const TOKEN = 'b'.repeat(64);
const CODE_SENT = { expiresAt: '2030-01-01T00:05:00.000Z', delivered: true };

/** An error shaped exactly like mazad-api's error envelope. */
function apiError(status: number, errorCode: string) {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: {},
    data: { statusCode: status, errorCode, message: 'server text', details: null },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
}

beforeAll(async () => {
  addNamespaceBundle('auth', 'en', authEn);
  addNamespaceBundle('auth', 'ar', authAr);
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(authApi.requestOtp).mockReset().mockResolvedValue(CODE_SENT);
  vi.mocked(authApi.verifyResetCode)
    .mockReset()
    .mockResolvedValue({ resetToken: TOKEN, resetTokenExpiresAt: '2030-01-01T00:10:00.000Z' });
  vi.mocked(authApi.resetPassword).mockReset().mockResolvedValue(undefined);
  router.replace.mockClear();
  useToastStore.setState({ toasts: [] });
  setSessionTokens(null);
});

function setup() {
  const user = userEvent.setup();
  renderWithQuery(<ResetPasswordForm />);
  return user;
}

async function requestCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/phone number/i), PHONE);
  await user.click(screen.getByRole('button', { name: /send verification code/i }));
  return screen.findByLabelText(/verification code/i);
}

async function reachPasswordStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await requestCode(user), '123456');
  await user.click(screen.getByRole('button', { name: /verify code/i }));
  return screen.findByLabelText(/new password/i);
}

describe('ResetPasswordForm', () => {
  it('requests a PASSWORD_RESET code for the phone and locks it', async () => {
    const user = setup();
    await requestCode(user);

    expect(authApi.requestOtp).toHaveBeenCalledWith(PHONE, 'PASSWORD_RESET');
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('readonly');
    expect(authApi.verifyResetCode).not.toHaveBeenCalled();
  });

  it('does not request a code for an invalid phone', async () => {
    const user = setup();
    await user.type(screen.getByLabelText(/phone number/i), 'not-a-phone');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    expect(await screen.findByText(/valid phone/i)).toBeInTheDocument();
    expect(authApi.requestOtp).not.toHaveBeenCalled();
  });

  it('shows the API error for a wrong code and stays on the code step', async () => {
    vi.mocked(authApi.verifyResetCode).mockRejectedValueOnce(apiError(401, 'OTP_INVALID'));
    const user = setup();
    await user.type(await requestCode(user), '000000');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/code is incorrect/i);
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it('explains when no account uses the number', async () => {
    vi.mocked(authApi.verifyResetCode).mockRejectedValueOnce(apiError(404, 'USER_NOT_FOUND'));
    const user = setup();
    await user.type(await requestCode(user), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no account found/i);
  });

  it('saves the new password with the reset token, then sends the user to sign in', async () => {
    const user = setup();
    await user.type(await reachPasswordStep(user), 'BrandNew123');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(authApi.verifyResetCode).toHaveBeenCalledWith(PHONE, '123456');
    expect(authApi.resetPassword).toHaveBeenCalledWith(TOKEN, 'BrandNew123');
    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toContain(
      'Password updated. Sign in with your new password.',
    );
  });

  it('drops a session this browser still held (the API revoked it)', async () => {
    setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
    const user = setup();
    await user.type(await reachPasswordStep(user), 'BrandNew123');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(getSessionTokens()).toBeNull();
  });

  it('enforces the 8-character minimum before calling the API', async () => {
    const user = setup();
    await user.type(await reachPasswordStep(user), 'short');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('offers to start again when the reset token expired', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValueOnce(apiError(401, 'RESET_TOKEN_INVALID'));
    const user = setup();
    await user.type(await reachPasswordStep(user), 'BrandNew123');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/expired or was already used/i);
    await user.click(screen.getByRole('button', { name: /start again/i }));

    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).not.toHaveAttribute('readonly');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('"Change number" returns to the phone step', async () => {
    const user = setup();
    await requestCode(user);
    await user.click(screen.getByRole('button', { name: /change number/i }));

    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).not.toHaveAttribute('readonly');
  });
});
