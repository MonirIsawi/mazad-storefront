import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AxiosError, type AxiosResponse } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { getSessionTokens, setSessionTokens } from '@shared/api';
import { useLocaleStore, useToastStore } from '@shared/store';
import { AuthGuard } from './AuthGuard';
import { AccountPage } from '../pages/AccountPage';
import { authApi } from '../api/auth.api';
import authEn from '../i18n/en.json';
import authAr from '../i18n/ar.json';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/account' }));
vi.mock('../api/auth.api', () => ({
  authApi: { me: vi.fn(), logout: vi.fn(), deleteAccount: vi.fn() },
}));

const USER = {
  id: 'u1',
  role: 'CUSTOMER' as const,
  phone: '+9647701234567',
  fullName: 'Ali Hassan',
  isVerified: true,
};

/** An error shaped exactly like mazad-api's error envelope. */
function apiError(
  status: number,
  errorCode: string,
  details: Record<string, unknown> | null = null,
) {
  const response = {
    status,
    statusText: '',
    headers: {},
    config: {},
    data: { statusCode: status, errorCode, message: 'server text', details },
  } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
}

beforeAll(async () => {
  addNamespaceBundle('auth', 'en', authEn);
  addNamespaceBundle('auth', 'ar', authAr);
  // AccountPage's locale toggle follows the locale store (default "ar"), not just i18n.
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(authApi.me).mockReset().mockResolvedValue(USER);
  vi.mocked(authApi.logout).mockReset().mockResolvedValue(undefined);
  vi.mocked(authApi.deleteAccount).mockReset().mockResolvedValue(undefined);
  router.replace.mockClear();
  useToastStore.setState({ toasts: [] });
  setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
});

afterEach(() => {
  setSessionTokens(null);
});

/** The account route as app/account/page.tsx composes it, with a client the test can inspect. */
async function openDeleteAccount() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // Someone else's cached data that must not survive the deletion.
  queryClient.setQueryData(['orders', 'list'], [{ id: 'order-1' }]);
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthGuard>
          <AccountPage />
        </AuthGuard>
      </I18nextProvider>
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Delete account' }));
  return { user, queryClient };
}

const confirmButton = () => screen.getByRole('button', { name: 'Delete my account' });

async function confirmDeletion(user: ReturnType<typeof userEvent.setup>, password = '') {
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('checkbox', { name: /can't be undone/i }));
  await user.click(confirmButton());
}

describe('Delete account', () => {
  it('explains the consequences and keeps the delete button disabled until confirmed', async () => {
    const { user } = await openDeleteAccount();

    expect(screen.getByText(/closed permanently and can't be restored/i)).toBeInTheDocument();
    expect(screen.getByText(/no longer show your name/i)).toBeInTheDocument();
    expect(screen.getByText(/for 30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/leave it empty/i)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /can't be undone/i }));
    expect(confirmButton()).toBeEnabled();
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
  });

  it('on success ends the local session and cache without calling logout, then goes home', async () => {
    const { user, queryClient } = await openDeleteAccount();

    await confirmDeletion(user, 'secret-pass');

    await waitFor(() => expect(getSessionTokens()).toBeNull());
    expect(authApi.deleteAccount).toHaveBeenCalledWith('secret-pass');
    expect(localStorage.getItem('mazad.accessToken')).toBeNull();
    expect(localStorage.getItem('mazad.refreshToken')).toBeNull();
    expect(queryClient.getQueryData(['orders', 'list'])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    // The API already revoked every session: POST /auth/logout could only 401.
    expect(authApi.logout).not.toHaveBeenCalled();
    // AuthGuard reacts to the cleared session too; the home redirect must be the last word.
    expect(router.replace).toHaveBeenLastCalledWith('/');
    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toEqual([
      'Your account was deleted.',
    ]);
  });

  it('sends no password when the field is left empty', async () => {
    const { user } = await openDeleteAccount();

    await confirmDeletion(user);

    await waitFor(() => expect(authApi.deleteAccount).toHaveBeenCalledWith(undefined));
  });

  it('disables the delete button while the request is in flight', async () => {
    vi.mocked(authApi.deleteAccount).mockReturnValue(new Promise(() => undefined));
    const { user } = await openDeleteAccount();

    await confirmDeletion(user, 'secret-pass');

    await waitFor(() => expect(confirmButton()).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it.each([
    ['PASSWORD_REQUIRED', 'Enter your password to delete your account.', ''],
    ['INVALID_CURRENT_PASSWORD', 'That password is incorrect.', 'wrong-pass'],
  ])('shows %s on the password field and focuses it', async (code, message, password) => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(apiError(400, code));
    const { user } = await openDeleteAccount();

    await confirmDeletion(user, password);

    expect(await screen.findByText(message)).toHaveAttribute('role', 'alert');
    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveFocus();
    expect(getSessionTokens()).not.toBeNull();
  });

  it('lists every reason the deletion is blocked, linking to the screens that exist', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(
      apiError(409, 'ACCOUNT_DELETION_BLOCKED', {
        reasons: ['BUYER_ORDERS_OPEN', 'WINS_PENDING', 'LEADING_BIDS', 'WALLET_NOT_EMPTY'],
      }),
    );
    const { user } = await openDeleteAccount();

    await confirmDeletion(user, 'secret-pass');

    const alert = await screen.findByText(/can't be deleted yet/i);
    const items = within(alert.parentElement as HTMLElement).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      "Your purchases that haven't been delivered or cancelled yet. My orders",
      'Auctions you won that are waiting for your confirmation. My wins',
      'Live auctions where you hold the highest bid. My bids',
      'A balance or a held amount in your wallet.',
    ]);
    // The wallet has no screen in the storefront, so that reason is listed without a link.
    expect(
      items.map((item) => within(item).queryByRole('link')?.getAttribute('href') ?? null),
    ).toEqual(['/account/orders', '/account/wins', '/account/bids', null]);
    expect(getSessionTokens()).not.toBeNull();
  });

  it('asks a passwordless account to sign in again, and offers to sign out', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(apiError(403, 'REAUTH_REQUIRED'));
    const { user } = await openDeleteAccount();

    await confirmDeletion(user);

    expect(await screen.findByText(/set a password with .Forgot password/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out and sign in again' }));
    await waitFor(() => expect(router.replace).toHaveBeenLastCalledWith('/login'));
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(getSessionTokens()).toBeNull();
  });

  it('shows a retry-later message when rate limited', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(apiError(429, 'REQUEST_FAILED'));
    const { user } = await openDeleteAccount();

    await confirmDeletion(user, 'secret-pass');

    expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument();
  });

  it('treats a 401 as signed out without calling logout', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(apiError(401, 'UNAUTHORIZED'));
    const { user } = await openDeleteAccount();

    await confirmDeletion(user, 'secret-pass');

    await waitFor(() => expect(getSessionTokens()).toBeNull());
    expect(router.replace).toHaveBeenLastCalledWith('/login');
    expect(authApi.logout).not.toHaveBeenCalled();
  });
});
