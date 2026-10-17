import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import sellingAr from '../i18n/ar.json';
import sellingEn from '../i18n/en.json';
import type { SellerAuction, SellerProduct } from '../types/selling.types';
import { AuctionForm } from './AuctionForm';

vi.mock('../api/selling.api', () => ({ sellingApi: {} }));

const product = {
  id: 'p1',
  nameEn: 'Camera',
  nameAr: 'كاميرا',
  condition: 'USED',
  images: [{ id: 'i1', url: 'https://example.test/a.jpg', sortOrder: 0, isCover: true }],
  category: { id: 'c1', name: 'Cameras' },
} as SellerProduct;

const draft = {
  id: 'a1',
  status: 'DRAFT',
  startingPrice: '400000',
  minIncrement: '5000',
  currentPrice: null,
  buyNowPrice: null,
  bidCount: 0,
  startsAt: '2026-10-20T10:00:00.000Z',
  endsAt: '2099-10-21T10:00:00.000Z',
  antiSnipingMinutes: 5,
  maxExtensions: 10,
  rejectionReason: null,
  cancelReason: null,
  product: { id: 'p1', nameEn: 'Camera', nameAr: 'كاميرا' },
} as SellerAuction;

beforeAll(async () => {
  addNamespaceBundle('selling', 'en', sellingEn);
  addNamespaceBundle('selling', 'ar', sellingAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

describe('AuctionForm: the step and the extension are Bidoom rules, shown not asked', () => {
  it('a new auction: the step follows the typed opening price; no step input', async () => {
    renderWithQuery(
      <AuctionForm
        products={[product]}
        initialProductId="p1"
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole('textbox', { name: /step/i })).toBeNull();
    await userEvent.type(screen.getByTestId('auction-startingPrice'), '400000');
    expect(screen.getAllByText(/^5,000/).length).toBe(2);
    expect(screen.getByText(/Bidoom sets this for every auction/)).toBeTruthy();
    expect(screen.getByText('Set by Bidoom')).toBeTruthy();
  });

  it('an existing auction: the extension from its payload', () => {
    renderWithQuery(
      <AuctionForm auction={draft} products={[product]} onDone={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(
      screen.getByText(/A bid in the last 5 minutes extends the auction, up to 10 times/),
    ).toBeTruthy();
    expect(screen.getByText('5 min, up to 10 times')).toBeTruthy();
  });
});
