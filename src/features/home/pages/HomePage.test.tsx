import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import type * as SharedHooks from '@shared/hooks';
import { homeApi } from '../api/home.api';
import homeAr from '../i18n/ar.json';
import homeEn from '../i18n/en.json';
import { HomePage } from './HomePage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../api/home.api', () => ({ homeApi: { getFeed: vi.fn(), listStores: vi.fn() } }));
const feature = vi.hoisted(() => ({ stores: false as boolean | undefined }));
vi.mock('@shared/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedHooks>()),
  useApiFeature: () => feature.stores,
}));

beforeAll(async () => {
  addNamespaceBundle('home', 'en', homeEn);
  addNamespaceBundle('home', 'ar', homeAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(homeApi.getFeed).mockReset();
  vi.mocked(homeApi.listStores).mockReset();
  feature.stores = false;
});

const emptyFeed = {
  live: [],
  upcoming: [],
  endingSoon: [],
  serverTime: '2026-10-09T10:00:00.000Z',
};

const store = (id: string, isVerified: boolean) => ({
  id,
  name: `Store ${id}`,
  nameEn: `Store ${id}`,
  nameAr: `Store ${id}`,
  city: 'Basra',
  coverUrl: null,
  isVerified,
  rating: { avg: 4.5, count: 3 },
  followers: 1,
  liveCount: 2,
  soldCount: 1,
  deliveryFee: '5000',
});

describe('HomePage', () => {
  it('leaves out "Ending soon" when nothing ends soon (no empty block above live auctions)', async () => {
    vi.mocked(homeApi.getFeed).mockResolvedValue({
      live: [],
      upcoming: [],
      endingSoon: [],
      serverTime: '2026-10-09T10:00:00.000Z',
    });
    renderWithQuery(<HomePage />);
    // Loaded (the live section's own empty state), not the loading skeleton.
    expect(await screen.findByText(homeEn.empty.live)).toBeTruthy();
    expect(screen.queryByText(homeEn.sections.endingSoon)).toBeNull();
    expect(screen.queryByText(homeEn.empty.endingSoon)).toBeNull();
  });

  it('greets the signed-in user by first name', async () => {
    vi.mocked(homeApi.getFeed).mockResolvedValue(emptyFeed);
    renderWithQuery(<HomePage userName="Zainab Kareem" />);
    expect(await screen.findByText(/^Good (morning|afternoon|evening), Zainab$/)).toBeTruthy();
  });

  it('has no stores rail while the API lacks GET /stores', async () => {
    vi.mocked(homeApi.getFeed).mockResolvedValue(emptyFeed);
    renderWithQuery(<HomePage />);
    expect(await screen.findByText(homeEn.empty.live)).toBeTruthy();
    expect(screen.queryByText(homeEn.sections.stores)).toBeNull();
    expect(homeApi.listStores).not.toHaveBeenCalled();
  });

  it('shows the verified stores once the API has them', async () => {
    feature.stores = true;
    vi.mocked(homeApi.getFeed).mockResolvedValue(emptyFeed);
    vi.mocked(homeApi.listStores).mockResolvedValue({
      items: [store('a', true), store('b', false)],
      nextCursor: null,
    });
    renderWithQuery(<HomePage />);
    expect(await screen.findByText(homeEn.sections.stores)).toBeTruthy();
    expect(screen.getByText('Store a')).toBeTruthy();
    expect(screen.queryByText('Store b')).toBeNull();
  });
});
