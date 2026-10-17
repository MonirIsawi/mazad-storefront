import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { renderWithQuery } from '@/test/render';
import authAr from '../i18n/ar.json';
import authEn from '../i18n/en.json';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

beforeAll(async () => {
  addNamespaceBundle('auth', 'en', authEn);
  addNamespaceBundle('auth', 'ar', authAr);
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  await i18n.changeLanguage('en');
});

function expectLegalLinks() {
  const nav = screen.getByRole('navigation', { name: 'Help and policies' });
  expect(within(nav).getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help');
  expect(within(nav).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    '/help/privacy',
  );
  expect(within(nav).getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/help/terms');
}

describe('help and policies before signing in', () => {
  it('the sign-in page links to Help, Privacy and Terms', () => {
    renderWithQuery(<LoginPage />);
    expectLegalLinks();
  });

  it('the sign-up page links to them too, and says creating an account accepts them', () => {
    renderWithQuery(<RegisterPage />);
    expectLegalLinks();
    const notice = screen.getByTestId('register-terms');
    expect(notice).toHaveTextContent(
      'By creating an account you agree to the Terms and Privacy policy.',
    );
    expect(within(notice).getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '/help/terms',
    );
    expect(within(notice).getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/help/privacy',
    );
    // A notice, not a gate: no checkbox to tick before signing up.
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    renderWithQuery(<RegisterPage />);
    const notice = screen.getByTestId('register-terms');
    expect(notice).toHaveTextContent('بإنشاء الحساب توافق على الشروط وسياسة الخصوصية.');
    expect(within(notice).getByRole('link', { name: 'سياسة الخصوصية' })).toHaveAttribute(
      'href',
      '/help/privacy',
    );
    expect(screen.getByRole('navigation', { name: 'المساعدة والسياسات' })).toBeTruthy();
  });
});
