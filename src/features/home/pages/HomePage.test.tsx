import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { homeApi } from '../api/home.api';
import homeAr from '../i18n/ar.json';
import homeEn from '../i18n/en.json';
import { HomePage } from './HomePage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../api/home.api', () => ({ homeApi: { getFeed: vi.fn() } }));

beforeAll(async () => {
  addNamespaceBundle('home', 'en', homeEn);
  addNamespaceBundle('home', 'ar', homeAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.mocked(homeApi.getFeed).mockReset();
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
});
