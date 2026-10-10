import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { catalogApi } from '../api/catalog.api';
import catalogAr from '../i18n/ar.json';
import catalogEn from '../i18n/en.json';
import { AuctionsBrowsePage } from './AuctionsBrowsePage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams('q=zzzqqq'),
  usePathname: () => '/auctions',
}));
vi.mock('../api/catalog.api', () => ({
  catalogApi: { listAuctions: vi.fn(), getCategories: vi.fn() },
}));

beforeAll(async () => {
  addNamespaceBundle('catalog', 'en', catalogEn);
  addNamespaceBundle('catalog', 'ar', catalogAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

describe('AuctionsBrowsePage: no results', () => {
  it('shows the empty state once, without a "0 results" line above it', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValue([]);
    vi.mocked(catalogApi.listAuctions).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);
    renderWithQuery(<AuctionsBrowsePage />);
    expect(await screen.findByText('No auctions match your filters.')).toBeTruthy();
    expect(screen.queryByText(/\b0 results\b/)).toBeNull();
  });

  it('offers the sorts; ending soonest is the default and sends nothing', async () => {
    vi.mocked(catalogApi.getCategories).mockResolvedValue([]);
    vi.mocked(catalogApi.listAuctions).mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    } as never);
    renderWithQuery(<AuctionsBrowsePage />);
    expect(await screen.findByRole('button', { name: 'Ending soonest' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Lowest price' })).toBeTruthy();
    expect(vi.mocked(catalogApi.listAuctions).mock.calls[0]![0]).not.toHaveProperty('sort');
  });
});
