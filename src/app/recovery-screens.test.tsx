import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import i18n from '@shared/i18n';
import { NotFoundScreen, RouteErrorScreen } from '@shared/components/feedback';
import RouteError from './error';
import GlobalError from './global-error';
import NotFound from './not-found';

function renderUi(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await i18n.changeLanguage('en');
});

describe('404 page', () => {
  it('says the page is missing and offers Home and Browse', async () => {
    await i18n.changeLanguage('en');
    renderUi(<NotFoundScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('This page doesn’t exist');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Browse auctions' })).toHaveAttribute(
      'href',
      '/auctions',
    );
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    renderUi(<NotFoundScreen />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('هذه الصفحة غير موجودة');
    expect(screen.getByRole('link', { name: 'تصفّح المزادات' })).toHaveAttribute(
      'href',
      '/auctions',
    );
  });

  it('is what app/not-found renders', () => {
    renderUi(<NotFound />);
    expect(screen.getByTestId('not-found')).toBeTruthy();
  });
});

describe('error page', () => {
  it('offers to try again, home and browse, without the technical message', async () => {
    await i18n.changeLanguage('en');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const retry = vi.fn();
    renderUi(<RouteError error={new Error('TypeError: x is undefined')} retry={retry} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('This page didn’t load');
    expect(screen.getByText(/Your bids are safe/)).toBeTruthy();
    expect(screen.queryByText(/x is undefined/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Browse auctions' })).toBeTruthy();
  });

  it('reads in Arabic', async () => {
    await i18n.changeLanguage('ar');
    renderUi(<RouteErrorScreen onRetry={vi.fn()} />);
    expect(screen.getByText('تعذّر تحميل الصفحة')).toBeTruthy();
    expect(screen.getByText(/مزايداتك محفوظة/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeTruthy();
  });

  it('the root-layout fallback shows both languages and can retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const retry = vi.fn();
    // It renders its own <html>; React warns about nesting it in a test container.
    render(<GlobalError error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('حدث خطأ ما.')).toBeTruthy();
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.getByText(/Bidoom couldn.t open right now/)).toBeTruthy();
    expect(screen.getByText(/تعذّر فتح بيدوم الآن/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
