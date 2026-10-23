import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import sellingAr from '../i18n/ar.json';
import sellingEn from '../i18n/en.json';
import type { SellerAuction, SellerProduct } from '../types/selling.types';
import { AuctionForm } from './AuctionForm';

const createAuction = vi.fn();
vi.mock('../api/selling.api', () => ({
  sellingApi: { createAuction: (values: unknown) => createAuction(values) },
}));

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

describe('AuctionForm: the seller sets the step and the extension', () => {
  it('a new auction: the step follows the opening price until a chip or a typed step sets it', async () => {
    renderWithQuery(
      <AuctionForm
        products={[product]}
        initialProductId="p1"
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    const step = screen.getByTestId('auction-minIncrement') as HTMLInputElement;
    await userEvent.type(screen.getByTestId('auction-startingPrice'), '400000');
    expect(step.value).toBe('5000');
    const chips = within(screen.getByTestId('auction-step-chips')).getAllByRole('button');
    expect(chips.map((chip) => chip.textContent)).toEqual(['1,000', '5,000', '10,000', '25,000']);
    expect(chips[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/Suggested for a 400,000 IQD opening: 5,000 IQD/)).toBeTruthy();

    await userEvent.click(chips[2] as HTMLElement);
    expect(step.value).toBe('10000');
    await userEvent.type(screen.getByTestId('auction-startingPrice'), '0');
    expect(step.value).toBe('10000');
    expect(screen.getByText('5 min, up to 10 times')).toBeTruthy();
  });

  it('checks the step and the extension with the API bounds', async () => {
    renderWithQuery(
      <AuctionForm
        products={[product]}
        initialProductId="p1"
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByTestId('auction-startingPrice'), '1000');
    await userEvent.clear(screen.getByTestId('auction-minIncrement'));
    await userEvent.type(screen.getByTestId('auction-minIncrement'), '2000');
    await userEvent.clear(screen.getByTestId('auction-antiSnipingMinutes'));
    await userEvent.type(screen.getByTestId('auction-antiSnipingMinutes'), '11');
    await userEvent.click(screen.getByTestId('auction-save-draft'));
    expect(screen.getByText(/from 250 IQD up to the opening price/)).toBeTruthy();
    expect(screen.getByText('The extension must be 1 to 10 minutes.')).toBeTruthy();
    expect(createAuction).not.toHaveBeenCalled();
  });

  it('sends the step and the extension, and shows INVALID_BID_STEP under the step', async () => {
    createAuction.mockRejectedValueOnce(
      Object.assign(new Error('bad step'), {
        isAxiosError: true,
        response: { status: 400, data: { errorCode: 'INVALID_BID_STEP' } },
      }),
    );
    renderWithQuery(
      <AuctionForm
        products={[product]}
        initialProductId="p1"
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.type(screen.getByTestId('auction-startingPrice'), '400000');
    await userEvent.clear(screen.getByTestId('auction-maxExtensions'));
    await userEvent.type(screen.getByTestId('auction-maxExtensions'), '3');
    await userEvent.click(screen.getByTestId('auction-save-draft'));
    await waitFor(() => expect(createAuction).toHaveBeenCalled());
    expect(createAuction.mock.calls[0]?.[0]).toMatchObject({
      startingPrice: 400000,
      minIncrement: 5000,
      antiSnipingMinutes: 5,
      maxExtensions: 3,
    });
    expect(await screen.findByText(/The bid step must be whole dinars/)).toBeTruthy();
  });

  it('an existing auction: its own step and extension', () => {
    renderWithQuery(
      <AuctionForm auction={draft} products={[product]} onDone={vi.fn()} onCancel={vi.fn()} />,
    );
    expect((screen.getByTestId('auction-minIncrement') as HTMLInputElement).value).toBe('5000');
    expect(
      screen.getByText(/Every bid in the last 5 minutes adds 5 minutes, up to 10 times/),
    ).toBeTruthy();
    expect(screen.getByText('5 min, up to 10 times')).toBeTruthy();
  });
});
