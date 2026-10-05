import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { renderWithQuery } from '@/test/render';
import { RegisterForm } from './RegisterForm';
import { authApi } from '../api/auth.api';
import authEn from '../i18n/en.json';
import authAr from '../i18n/ar.json';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../api/auth.api', () => ({
  authApi: { requestOtp: vi.fn(), register: vi.fn(), login: vi.fn(), logout: vi.fn(), me: vi.fn() },
}));

const PHONE = '+9647701234567';
const DETAILS = { fullName: 'Ali Hassan', phone: PHONE, password: 'validpassword123' };
const CODE_SENT = { expiresAt: '2030-01-01T00:05:00.000Z', delivered: true };
const ACCOUNT = {
  accessToken: 'access',
  refreshToken: 'refresh',
  sessionId: 'session',
  user: {
    id: 'u1',
    role: 'CUSTOMER' as const,
    phone: PHONE,
    fullName: 'Ali Hassan',
    isVerified: false,
  },
};

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
  vi.mocked(authApi.register).mockReset().mockResolvedValue(ACCOUNT);
  router.replace.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Pass `withFakeTimers` only after vi.useFakeTimers(): userEvent then drives the fake clock. */
function setup({ withFakeTimers = false } = {}) {
  const user = userEvent.setup(
    withFakeTimers ? { advanceTimers: vi.advanceTimersByTime.bind(vi) } : {},
  );
  renderWithQuery(<RegisterForm />);
  return user;
}

async function fillDetailsAndRequestCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), DETAILS.fullName);
  await user.type(screen.getByLabelText(/phone number/i), DETAILS.phone);
  await user.type(screen.getByLabelText(/^password$/i), DETAILS.password);
  await user.click(screen.getByRole('button', { name: /send verification code/i }));
  return screen.findByLabelText(/verification code/i);
}

describe('RegisterForm — sign-up with OTP', () => {
  it('requests a SIGNUP code and moves to the code step without creating an account', async () => {
    const user = setup();
    await fillDetailsAndRequestCode(user);

    expect(authApi.requestOtp).toHaveBeenCalledWith(PHONE, 'SIGNUP');
    expect(screen.getByText(/we sent a 6-digit code/i)).toHaveTextContent(PHONE);
    expect(screen.getByLabelText(/phone number/i)).toHaveAttribute('readonly');
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('does not request a code while the details are invalid', async () => {
    const user = setup();
    await user.type(screen.getByLabelText(/phone number/i), 'not-a-phone');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    expect(await screen.findByText(/valid phone number/i)).toBeInTheDocument();
    expect(authApi.requestOtp).not.toHaveBeenCalled();
  });

  it('creates the account with the correct code and the same phone', async () => {
    const user = setup();
    const codeInput = await fillDetailsAndRequestCode(user);

    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(authApi.register).toHaveBeenCalledTimes(1);
    expect(vi.mocked(authApi.register).mock.calls[0]?.[0]).toEqual({ ...DETAILS, code: '123456' });
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
  });

  it.each([
    ['too short', '123'],
    ['not digits', '12a456'],
    ['empty', ''],
  ])('does not send /auth/register for a %s code', async (_label, code) => {
    const user = setup();
    const codeInput = await fillDetailsAndRequestCode(user);

    if (code) await user.type(codeInput, code);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/enter the 6-digit code/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('shows a clear message when the API rejects a wrong code', async () => {
    vi.mocked(authApi.register).mockRejectedValue(apiError(401, 'OTP_INVALID'));
    const user = setup();
    await user.type(await fillDetailsAndRequestCode(user), '000000');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/that code is incorrect/i);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it.each([
    ['OTP_EXPIRED_OR_MISSING', /expired or was already used/i],
    ['OTP_EXHAUSTED', /too many wrong attempts/i],
  ])('explains an expired, used or locked code (%s)', async (errorCode, message) => {
    vi.mocked(authApi.register).mockRejectedValue(apiError(401, errorCode));
    const user = setup();
    await user.type(await fillDetailsAndRequestCode(user), '123456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });

  it('resends a code after the 60s cooldown without creating an account', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = setup({ withFakeTimers: true });
    await user.type(await fillDetailsAndRequestCode(user), '111');

    const waiting = screen.getByRole('button', { name: /resend code in \d+s/i });
    expect(waiting).toBeDisabled();

    act(() => void vi.advanceTimersByTime(60_000));
    await user.click(await screen.findByRole('button', { name: /^resend code$/i }));

    expect(authApi.requestOtp).toHaveBeenCalledTimes(2);
    expect(authApi.requestOtp).toHaveBeenLastCalledWith(PHONE, 'SIGNUP');
    expect(authApi.register).not.toHaveBeenCalled();
    expect(await screen.findByRole('status')).toHaveTextContent(/new code is on its way/i);
    expect(screen.getByLabelText(/verification code/i)).toHaveValue('');
  });

  it.each([
    ['per-phone limit', apiError(429, 'OTP_RATE_LIMITED'), /try again in an hour/i],
    ['per-IP throttler (no errorCode)', apiError(429, 'REQUEST_FAILED'), /too many attempts/i],
    ['resend cooldown', apiError(429, 'OTP_RESEND_COOLDOWN'), /wait a minute/i],
  ])('shows the %s error when requesting a code', async (_label, error, message) => {
    vi.mocked(authApi.requestOtp).mockRejectedValue(error);
    const user = setup();
    await user.type(screen.getByLabelText(/full name/i), DETAILS.fullName);
    await user.type(screen.getByLabelText(/phone number/i), DETAILS.phone);
    await user.type(screen.getByLabelText(/^password$/i), DETAILS.password);
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('points to the Telegram bot when the code could not be delivered directly', async () => {
    vi.mocked(authApi.requestOtp).mockResolvedValue({
      expiresAt: CODE_SENT.expiresAt,
      delivered: false,
      telegramDeepLink: 'https://t.me/mazad_bot?start=abc',
    });
    const user = setup();
    await fillDetailsAndRequestCode(user);

    expect(screen.getByRole('link', { name: /open telegram/i })).toHaveAttribute(
      'href',
      'https://t.me/mazad_bot?start=abc',
    );
  });

  it('goes back to editable details when the number is changed', async () => {
    const user = setup();
    await fillDetailsAndRequestCode(user);
    await user.click(screen.getByRole('button', { name: /change number/i }));

    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
  });
});
