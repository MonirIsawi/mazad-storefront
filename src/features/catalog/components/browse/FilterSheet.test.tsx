import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { catalogApi } from '../../api/catalog.api';
import catalogAr from '../../i18n/ar.json';
import catalogEn from '../../i18n/en.json';
import { FilterSheet } from './FilterSheet';

vi.mock('../../api/catalog.api', () => ({ catalogApi: { listAuctions: vi.fn() } }));

beforeAll(async () => {
  addNamespaceBundle('catalog', 'en', catalogEn);
  addNamespaceBundle('catalog', 'ar', catalogAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

const category = (id: string, name: string) => ({
  id,
  slug: id,
  name,
  nameEn: name,
  nameAr: name,
  iconUrl: null,
  sortOrder: 0,
  children: [],
});

describe('FilterSheet', () => {
  it('says how many results the pending filters show, and applies only on the button', async () => {
    vi.mocked(catalogApi.listAuctions).mockImplementation(async (params) => ({
      data: [],
      meta: { page: 1, limit: 1, total: params.categoryId ? 32 : 120, totalPages: 1 },
    }));
    const onApply = vi.fn();
    renderWithQuery(
      <FilterSheet
        filters={{ q: 'phone' }}
        categories={[category('c1', 'Phones')]}
        onApply={onApply}
        onClose={() => {}}
      />,
    );
    expect(await screen.findByRole('button', { name: 'Show 120 results' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Phones' }));
    expect(await screen.findByRole('button', { name: 'Show 32 results' })).toBeTruthy();
    // Counted for the search plus the pending filters, as a one-item page.
    await waitFor(() =>
      expect(catalogApi.listAuctions).toHaveBeenLastCalledWith({
        q: 'phone',
        categoryId: 'c1',
        status: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        condition: undefined,
        limit: 1,
      }),
    );
    expect(onApply).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Show 32 results' }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'c1' }));
  });
});
