import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import winsAr from '../i18n/ar.json';
import winsEn from '../i18n/en.json';
import { winsApi } from '../api/wins.api';
import { WinsPage } from './WinsPage';

vi.mock('../api/wins.api', () => ({ winsApi: { list: vi.fn() } }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/account/wins',
}));

beforeAll(async () => {
  addNamespaceBundle('wins', 'en', winsEn);
  addNamespaceBundle('wins', 'ar', winsAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
  setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
});

const win = {
  id: 'w1',
  auctionId: 'a1',
  rank: 1,
  amount: '410000.00',
  status: 'CONFIRMED' as const,
  confirmedAt: '2026-10-20T10:00:00.000Z',
  createdAt: '2026-10-20T10:00:00.000Z',
  auction: {
    id: 'a1',
    status: 'SOLD',
    storeId: 's1',
    endsAt: '2026-10-20T10:00:00.000Z',
    product: { nameEn: 'Camera', nameAr: 'كاميرا' },
  },
  orderItem: { orderId: 'o1' },
};

describe('WinsPage: wins are orders, nothing to confirm', () => {
  it('lists each win linking to its order, with "How winning works" and no confirm step', async () => {
    vi.mocked(winsApi.list).mockResolvedValue([win]);
    renderWithQuery(
      <WinsPage
        addresses={[{ id: 'ad1', label: 'Home', city: 'Baghdad', isDefault: true }]}
        orders={{ o1: { orderNumber: 'BD-1001', status: 'CONFIRMED', imageByWin: {} } }}
      />,
    );
    const card = await screen.findByRole('link', { name: /Camera/ });
    expect(card.getAttribute('href')).toBe('/account/orders/o1');
    expect(card).toHaveTextContent('BD-1001');
    expect(screen.getByText(/There is nothing to confirm\./)).toBeTruthy();
    expect(screen.getByText(/until the seller ships it/)).toBeTruthy();
    expect(screen.getByText(/two violations pause bidding/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /confirm|decline/i })).toBeNull();
  });
});
