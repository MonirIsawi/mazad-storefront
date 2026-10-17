import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { sellersApi } from '../api/sellers.api';
import sellersAr from '../i18n/ar.json';
import sellersEn from '../i18n/en.json';
import type { SellerProfile } from '../types/sellers.types';
import { SellerProfilePage } from './SellerProfilePage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
vi.mock('../api/sellers.api', () => ({ sellersApi: { getProfile: vi.fn() } }));

const profile = (extra: Partial<SellerProfile> = {}): SellerProfile => ({
  id: 's1',
  fullName: 'Ali Hassan',
  isVerified: true,
  memberSince: '2024-03-01T10:00:00.000Z',
  followerCount: 2340,
  rating: { average: 4.8, count: 214 },
  stores: [
    { id: 'st-b', nameEn: 'Branch', nameAr: 'الفرع', city: 'Erbil', isDefault: false },
    { id: 'st-a', nameEn: 'Main store', nameAr: 'المتجر', city: 'Baghdad', isDefault: true },
  ],
  ...extra,
});

beforeAll(async () => {
  addNamespaceBundle('sellers', 'en', sellersEn);
  addNamespaceBundle('sellers', 'ar', sellersAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

describe('SellerProfilePage', () => {
  it('shows the person, their followers and stores, and composes rating and auctions', async () => {
    vi.mocked(sellersApi.getProfile).mockResolvedValue(profile());
    const renderRating = vi.fn((storeId: string) => (
      <a href={`/stores/${storeId}?tab=ratings`}>r</a>
    ));
    renderWithQuery(
      <SellerProfilePage
        id="s1"
        renderFollowToggle={(id) => <button type="button">follow {id}</button>}
        renderRating={renderRating}
        renderAuctions={(title) => <h2>{title}</h2>}
      />,
    );
    expect(await screen.findByRole('heading', { level: 1, name: /Ali Hassan/ })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Verified seller' })).toBeTruthy();
    expect(screen.getByText('2,340 followers')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'follow s1' })).toBeTruthy();
    // The rating opens the default store's ratings, not the first store's.
    expect(renderRating).toHaveBeenCalledWith('st-a', expect.anything());
    expect(screen.getByRole('link', { name: /Main store/ }).getAttribute('href')).toBe(
      '/stores/st-a',
    );
    expect(screen.getByRole('heading', { name: 'Current auctions' })).toBeTruthy();
  });

  it('before the first rating: no rating link, says so', async () => {
    vi.mocked(sellersApi.getProfile).mockResolvedValue(
      profile({ rating: { average: null, count: 0 } }),
    );
    const renderRating = vi.fn();
    renderWithQuery(<SellerProfilePage id="s1" renderRating={renderRating} />);
    expect(await screen.findByText('No reviews yet')).toBeTruthy();
    expect(renderRating).not.toHaveBeenCalled();
  });
});
