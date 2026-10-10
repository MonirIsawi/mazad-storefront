import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { httpClient, setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { ordersApi } from './api/orders.api';
import ordersAr from './i18n/ar.json';
import ordersEn from './i18n/en.json';
import { isOpenSale, nextSellerStatus, sellerReturnActions } from './lib/seller-orders';
import { OrderDetailPage, SaleDetailPage } from './pages/OrderDetailPage';
import { SalesPage } from './pages/OrdersPage';
import type { Order, OrderStatus } from './types/orders.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/account/selling/sales',
}));

const realApi = (await vi.importActual<{ ordersApi: typeof ordersApi }>('./api/orders.api'))
  .ordersApi;
vi.mock('./api/orders.api', () => ({
  ordersApi: {
    list: vi.fn(),
    listSales: vi.fn(),
    get: vi.fn(),
    cancel: vi.fn(),
    openReturn: vi.fn(),
    updateStatus: vi.fn(),
    returnAction: vi.fn(),
  },
}));
const api = vi.mocked(ordersApi);

type ReturnRequest = Order['items'][number]['returnRequest'];

function makeSale(status: OrderStatus, returnRequest: ReturnRequest = null): Order {
  return {
    id: 'o1',
    orderNumber: 'ORD-2026-AB',
    status,
    subtotal: '250000.00',
    deliveryFee: '5000.00',
    total: '255000.00',
    shipCity: 'Baghdad',
    shipArea: 'Karrada',
    shipStreet: null,
    shipDetails: null,
    shipPhone: '+9647701234567',
    note: null,
    cancelReason: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    items: [
      {
        id: 'i1',
        productId: 'p1',
        finalPrice: '250000.00',
        product: { id: 'p1', nameEn: 'Camera', nameAr: 'كاميرا' },
        win: { id: 'w1', amount: '250000.00' },
        returnRequest,
      },
    ],
    store: { id: 's1', nameEn: 'Store', nameAr: 'متجر', city: 'Baghdad' },
    seller: { id: 'u2', fullName: 'Seller', isVerified: true },
    customer: { id: 'u3', fullName: 'Ali Buyer', phone: '+9647700000302' },
  };
}

const returnOf = (status: NonNullable<ReturnRequest>['status']): ReturnRequest => ({
  id: 'r1',
  status,
  reason: 'Arrived scratched',
  requestedAt: '2026-10-03T10:00:00.000Z',
});

function renderPage(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  );
}

beforeAll(async () => {
  addNamespaceBundle('orders', 'en', ordersEn);
  addNamespaceBundle('orders', 'ar', ordersAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.clearAllMocks();
  setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
});

afterEach(() => {
  setSessionTokens(null);
  vi.restoreAllMocks();
});

describe('seller order rules (mazad-api SELLER_TRANSITIONS)', () => {
  it('moves an order one step at a time and stops when it is done', () => {
    expect(nextSellerStatus('CREATED')).toBe('CONFIRMED');
    expect(nextSellerStatus('CONFIRMED')).toBe('OUT_FOR_DELIVERY');
    expect(nextSellerStatus('OUT_FOR_DELIVERY')).toBe('DELIVERED');
    expect(nextSellerStatus('DELIVERED')).toBeNull();
    expect(nextSellerStatus('CANCELLED')).toBeNull();
    expect(isOpenSale({ status: 'CREATED' })).toBe(true);
    expect(isOpenSale({ status: 'DELIVERED' })).toBe(false);
  });

  it('offers only the return actions the API accepts in each state', () => {
    expect(sellerReturnActions('REQUESTED')).toEqual(['approve', 'reject']);
    expect(sellerReturnActions('APPROVED')).toEqual(['received']);
    expect(sellerReturnActions('PRODUCT_RETURNED')).toEqual(['refund']);
    for (const status of ['REJECTED', 'REFUNDED', 'CANCELLED'] as const) {
      expect(sellerReturnActions(status)).toEqual([]);
    }
  });
});

describe('ordersApi seller calls', () => {
  it('hits the seller endpoints with the bodies the API validates', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: {} });
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: [] });
    await realApi.listSales();
    expect(get).toHaveBeenCalledWith('/me/sales', { params: { limit: 50 } });
    await realApi.updateStatus('o1', 'CONFIRMED');
    expect(post).toHaveBeenCalledWith('/orders/o1/status', { status: 'CONFIRMED' });
    await realApi.returnAction('r1', 'approve');
    expect(post).toHaveBeenCalledWith('/returns/r1/approve', undefined);
    await realApi.returnAction('r1', 'reject', 'Used item');
    expect(post).toHaveBeenCalledWith('/returns/r1/reject', { reason: 'Used item' });
  });
});

describe('SalesPage', () => {
  it("lists the seller's received orders with the buyer, linking to the sale view", async () => {
    api.listSales.mockResolvedValue([makeSale('CREATED')]);
    renderPage(<SalesPage />);
    const row = await screen.findByText('Buyer: Ali Buyer');
    expect(row.closest('a')?.getAttribute('href')).toBe('/account/selling/sales/o1');
    expect(api.list).not.toHaveBeenCalled();
  });

  it('explains where orders come from when there are none', async () => {
    api.listSales.mockResolvedValue([]);
    renderPage(<SalesPage />);
    expect(await screen.findByText('No orders yet')).toBeTruthy();
  });
});

describe('SaleDetailPage', () => {
  it.each<[OrderStatus, string, OrderStatus]>([
    ['CREATED', 'Confirm order', 'CONFIRMED'],
    ['CONFIRMED', 'Mark as out for delivery', 'OUT_FOR_DELIVERY'],
  ])('%s: offers "%s" and sends %s', async (status, label, next) => {
    api.get.mockResolvedValue(makeSale(status));
    api.updateStatus.mockResolvedValue(undefined);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByRole('button', { name: label }));
    expect(screen.getByText('Buyer: Ali Buyer')).toBeTruthy();
    expect(api.updateStatus).toHaveBeenCalledWith('o1', next, undefined);
  });

  it('OUT_FOR_DELIVERY: confirms the exact cash received before Delivered, and sends it', async () => {
    const sale = makeSale('OUT_FOR_DELIVERY');
    api.get.mockResolvedValue(sale);
    api.updateStatus.mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as delivered' }));
    expect(confirm.mock.calls[0]![0]).toMatch(/^Did you receive .+ from the buyer\?/);
    expect(api.updateStatus).toHaveBeenCalledWith('o1', 'DELIVERED', Number(sale.total));
    confirm.mockRestore();
  });

  it('OUT_FOR_DELIVERY: sends nothing when the seller has not received the cash', async () => {
    api.get.mockResolvedValue(makeSale('OUT_FOR_DELIVERY'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as delivered' }));
    expect(api.updateStatus).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('says who cancelled an order', async () => {
    api.get.mockResolvedValue({
      ...makeSale('CANCELLED'),
      cancelledBy: 'SELLER',
      cancelReason: null,
    });
    renderPage(<SaleDetailPage id="o1" />);
    expect(await screen.findByText('Cancelled by the seller')).toBeTruthy();
  });

  it('sends one status change for a double click', async () => {
    api.get.mockResolvedValue(makeSale('CREATED'));
    api.updateStatus.mockReturnValue(new Promise(() => {}));
    renderPage(<SaleDetailPage id="o1" />);
    const button = await screen.findByTestId('sale-next-step');
    // Two clicks before React re-renders the button as loading.
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(api.updateStatus).toHaveBeenCalledTimes(1);
  });

  it('lets the seller call the delivery phone the buyer gave', async () => {
    api.get.mockResolvedValue(makeSale('CONFIRMED'));
    renderPage(<SaleDetailPage id="o1" />);
    const link = await screen.findByRole('link', { name: 'Call the buyer +9647701234567' });
    expect(link.getAttribute('href')).toBe('tel:+9647701234567');
  });

  it("shows the buyer's own phone as text on their order", async () => {
    api.get.mockResolvedValue(makeSale('CONFIRMED'));
    renderPage(<OrderDetailPage id="o1" />);
    expect(await screen.findByText('+9647701234567')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Call the buyer/ })).toBeNull();
  });

  it('has no next step once delivered, and never offers the buyer a return', async () => {
    api.get.mockResolvedValue(makeSale('DELIVERED'));
    renderPage(<SaleDetailPage id="o1" />);
    await screen.findByText('Camera');
    expect(screen.queryByTestId('sale-next-step')).toBeNull();
    expect(screen.queryByRole('button', { name: /return/i })).toBeNull();
  });

  it('approves a requested return and shows the buyer reason', async () => {
    api.get.mockResolvedValue(makeSale('DELIVERED', returnOf('REQUESTED')));
    api.returnAction.mockResolvedValue(undefined);
    renderPage(<SaleDetailPage id="o1" />);
    expect(await screen.findByText("Buyer's reason: Arrived scratched")).toBeTruthy();
    await userEvent.click(screen.getByTestId('sale-return-approve'));
    expect(api.returnAction).toHaveBeenCalledWith('r1', 'approve', undefined);
  });

  it('rejects a return only with a reason', async () => {
    api.get.mockResolvedValue(makeSale('DELIVERED', returnOf('REQUESTED')));
    api.returnAction.mockResolvedValue(undefined);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Reject' }));
    const submit = screen.getByRole('button', { name: 'Reject return' });
    expect(submit).toHaveProperty('disabled', true);
    await userEvent.type(screen.getByLabelText('Why are you rejecting it?'), ' Worn ');
    await userEvent.click(submit);
    expect(api.returnAction).toHaveBeenCalledWith('r1', 'reject', 'Worn');
  });

  it('marks a returned product as received', async () => {
    api.get.mockResolvedValue(makeSale('DELIVERED', returnOf('APPROVED')));
    api.returnAction.mockResolvedValue(undefined);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByTestId('sale-return-received'));
    expect(api.returnAction).toHaveBeenCalledWith('r1', 'received', undefined);
  });

  it.each([
    [true, 1],
    [false, 0],
  ])('asks before recording a refund, with the amount (confirmed: %s)', async (ok, calls) => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(ok);
    api.get.mockResolvedValue(makeSale('DELIVERED', returnOf('PRODUCT_RETURNED')));
    api.returnAction.mockResolvedValue(undefined);
    renderPage(<SaleDetailPage id="o1" />);
    await userEvent.click(await screen.findByTestId('sale-return-refund'));
    expect(confirm).toHaveBeenCalledWith(
      expect.stringMatching(
        /^Refund (250,000 IQD|٢٥٠,٠٠٠ د\.ع) to the buyer\? This can't be undone\.$/,
      ),
    );
    expect(api.returnAction).toHaveBeenCalledTimes(calls);
  });
});
