import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { getSessionTokens } from '@shared/api';
import { renderWithQuery } from '@/test/render';
import { AccountDeletionInfoPage } from './AccountDeletionInfoPage';
import { authApi } from '../api/auth.api';
import authEn from '../i18n/en.json';
import authAr from '../i18n/ar.json';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock('../api/auth.api', () => ({
  authApi: { me: vi.fn(), logout: vi.fn(), deleteAccount: vi.fn() },
}));

beforeAll(async () => {
  addNamespaceBundle('auth', 'en', authEn);
  addNamespaceBundle('auth', 'ar', authAr);
  await i18n.changeLanguage('en');
});

describe('AccountDeletionInfoPage (public)', () => {
  it('explains how to delete an account to a signed-out visitor, with no way to delete', async () => {
    expect(getSessionTokens()).toBeNull();

    renderWithQuery(<AccountDeletionInfoPage />);

    expect(
      await screen.findByRole('heading', { name: 'Delete your Mazad account' }),
    ).toBeInTheDocument();
    for (const section of [
      'How to delete your account',
      'Before you can delete',
      'What is deleted',
      'What is kept, and why',
      'After deletion',
    ]) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument();
    }
    expect(screen.getByText(/for 30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/A balance or a held amount in your wallet/)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /delete/i })).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
    expect(authApi.me).not.toHaveBeenCalled();
  });
});
