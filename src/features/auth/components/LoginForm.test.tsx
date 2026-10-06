import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { renderWithQuery } from '@/test/render';
import { LoginForm } from './LoginForm';
import authEn from '../i18n/en.json';
import authAr from '../i18n/ar.json';

// useLogin() calls next/navigation's useRouter for the post-login redirect; the App Router
// context it normally comes from doesn't exist in a plain RTL render (see
// docs/testing/integration-testing.md).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

beforeAll(async () => {
  addNamespaceBundle('auth', 'en', authEn);
  addNamespaceBundle('auth', 'ar', authAr);
  await i18n.changeLanguage('en');
});

describe('LoginForm', () => {
  it('shows a validation error for an invalid phone number', async () => {
    renderWithQuery(<LoginForm />);

    // A valid password keeps this test isolated to the phone field — an empty form would
    // raise both errors at once and findByRole('alert') requires exactly one match.
    await userEvent.type(screen.getByLabelText(/phone/i), 'not-a-phone');
    await userEvent.type(screen.getByLabelText(/password/i), 'validpassword123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid phone/i);
  });

  it('links to the password reset', () => {
    renderWithQuery(<LoginForm />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute(
      'href',
      '/reset-password',
    );
  });
});
