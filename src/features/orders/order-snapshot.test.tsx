import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { ordersApi } from './api/orders.api';
import { paymentsApi } from './api/payments.api';
import ordersAr from './i18n/ar.json';
import ordersEn from './i18n/en.json';
import { OrderDetailPage, SaleDetailPage } from './pages/OrderDetailPage';
import { OrdersPage, SalesPage } from './pages/OrdersPage';
import { orderSchema } from './schemas/orders.schema';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/account/orders',
}));
vi.mock('./api/orders.api', () => ({
  ordersApi: { list: vi.fn(), listSales: vi.fn(), get: vi.fn() },
}));
vi.mock('./api/payments.api', () => ({
  paymentsApi: { methods: vi.fn(), forOrder: vi.fn(), startSwiftPay: vi.fn(), mine: vi.fn() },
}));
const api = vi.mocked(ordersApi);

/** One order item as mazad-api sends it: the snapshot in `display`, the product as it is now. */
const item = (id: string, display: Record<string, unknown> | undefined) => ({
  id,
  productId: `p-${id}`,
  finalPrice: '250000.00',
  product: { id: `p-${id}`, nameEn: `Renamed ${id}`, nameAr: `اسم جديد ${id}` },
  win: { id: `w-${id}`, amount: '250000.00' },
  returnRequest: null,
  ...(display ? { display } : {}),
});

const snapshot = (extra: Record<string, unknown> = {}) => ({
  productId: 'p-i1',
  auctionId: 'a1',
  nameEn: 'Vintage camera',
  nameAr: 'كاميرا قديمة',
  imageUrl: 'https://cdn.test/images/full.webp',
  thumbUrl: 'https://cdn.test/images/thumb.webp',
  condition: 'USED',
  marketPrice: null,
  buyNowPrice: null,
  finalPrice: '250000.00',
  fromSnapshot: true,
  listingAvailable: true,
  ...extra,
});

/** GET /orders/:id (or one row of /me/orders), parsed by the real schema. */
function order(extra: Record<string, unknown> = {}) {
  return orderSchema.parse({
    id: 'o1',
    orderNumber: 'ORD-2026-AB',
    status: 'CREATED',
    subtotal: '250000.00',
    deliveryFee: '5000.00',
    total: '255000.00',
    shipCity: 'Baghdad',
    shipArea: null,
    shipStreet: null,
    shipDetails: null,
    shipPhone: null,
    note: null,
    cancelReason: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    items: [item('i1', snapshot())],
    storeName: { nameEn: 'Ali Store (then)', nameAr: 'متجر علي سابقًا' },
    payments: [
      { id: 'pay1', method: 'CASH_ON_DELIVERY', status: 'PENDING', paidAt: null, amount: '1' },
    ],
    store: { id: 's1', nameEn: 'Ali Store (now)', nameAr: 'متجر علي', city: 'Baghdad' },
    seller: { id: 'u2', fullName: 'Seller', isVerified: true },
    customer: { id: 'u3', fullName: 'Ali Buyer', phone: null },
    ...extra,
  });
}

/** An order from before the snapshot: no display, no storeName, no payments. */
const legacy = () => {
  const data = order({ items: [item('i1', undefined)] });
  return { ...data, storeName: undefined, payments: undefined };
};

const imageSrc = (scope: HTMLElement) =>
  decodeURIComponent(within(scope).getByRole('img').getAttribute('src') ?? '');

beforeAll(async () => {
  addNamespaceBundle('orders', 'en', ordersEn);
  addNamespaceBundle('orders', 'ar', ordersAr);
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  vi.clearAllMocks();
  setSessionTokens({ accessToken: 'access', refreshToken: 'refresh' });
  vi.mocked(paymentsApi.forOrder).mockResolvedValue({
    orderId: 'o1',
    paidAt: null,
    paidPaymentId: null,
    payments: [],
  });
  vi.mocked(paymentsApi.methods).mockResolvedValue({
    cashOnDelivery: { enabled: true },
    swiftpay: { enabled: false, mode: 'test', currency: 'IQD' },
  });
});

afterEach(() => {
  setSessionTokens(null);
});

describe('orders list (buyer)', () => {
  it('shows the product as bought: thumbnail, name, number, prices, payment and total', async () => {
    api.list.mockResolvedValue([order()]);
    renderWithQuery(<OrdersPage />);
    const name = await screen.findByTestId('order-row-name');
    expect(name).toHaveTextContent('Vintage camera');
    const row = name.closest('a')!;
    expect(row.getAttribute('href')).toBe('/account/orders/o1');
    expect(imageSrc(row)).toContain('https://cdn.test/images/thumb.webp');
    expect(row).toHaveTextContent('ORD-2026-AB');
    expect(row).toHaveTextContent('Item 250,000 IQD · Delivery 5,000 IQD');
    expect(row).toHaveTextContent('255,000 IQD');
    expect(row).toHaveTextContent('Pending');
    expect(within(row).getByTestId('order-row-payment')).toHaveTextContent('Cash on delivery');
    // The store's name from the order, not as it is called now; never the current product name.
    expect(row).toHaveTextContent('Ali Store (then)');
    expect(row).not.toHaveTextContent('Renamed');
  });

  it('several items: the first, "+N more", the items subtotal; card once paid by card', async () => {
    api.list.mockResolvedValue([
      order({
        items: [item('i1', snapshot()), item('i2', snapshot({ nameEn: 'Lens' }))],
        subtotal: '500000.00',
        total: '505000.00',
        payments: [
          { id: 'pay2', method: 'SWIFTPAY', status: 'PAID', paidAt: '2026-10-01T11:00:00Z' },
          { id: 'pay1', method: 'CASH_ON_DELIVERY', status: 'CANCELLED', paidAt: null },
        ],
      }),
    ]);
    renderWithQuery(<OrdersPage />);
    const name = await screen.findByTestId('order-row-name');
    expect(name).toHaveTextContent('Vintage camera +1 more');
    const row = name.closest('a')!;
    expect(row).toHaveTextContent('Items 500,000 IQD · Delivery 5,000 IQD');
    expect(within(row).getByTestId('order-row-payment')).toHaveTextContent('Card');
  });

  it('an older order without the snapshot still renders, with a placeholder photo', async () => {
    api.list.mockResolvedValue([legacy()]);
    renderWithQuery(<OrdersPage />);
    const name = await screen.findByTestId('order-row-name');
    expect(name).toHaveTextContent('Renamed i1');
    const row = name.closest('a')!;
    expect(within(row).getByTestId('order-item-image').querySelector('img')).toBeNull();
    expect(row).toHaveTextContent('Ali Store (now)');
  });
});

describe('order detail (buyer)', () => {
  it('the product photo, name and price near the top, prices, payment and status', async () => {
    api.get.mockResolvedValue(order());
    renderWithQuery(<OrderDetailPage id="o1" />);
    const name = await screen.findByText('Vintage camera');
    const itemRow = name.closest('[data-testid="order-item-row"]') as HTMLElement;
    expect(imageSrc(itemRow)).toContain('https://cdn.test/images/full.webp');
    expect(itemRow).toHaveTextContent('250,000 IQD');
    expect(screen.getByText('Delivery fee').nextSibling).toHaveTextContent('5,000 IQD');
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('255,000 IQD');
    expect(screen.getByTestId('order-payment-summary')).toHaveTextContent(
      'Cash on delivery · Not paid yet',
    );
    expect(screen.getByText('Ali Store (then)')).toBeTruthy();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByTestId('order-view-listing').getAttribute('href')).toBe('/auctions/a1');
  });

  it('no listing link once the auction page is gone', async () => {
    api.get.mockResolvedValue(
      order({ items: [item('i1', snapshot({ listingAvailable: false }))] }),
    );
    renderWithQuery(<OrderDetailPage id="o1" />);
    expect(await screen.findByText('Vintage camera')).toBeTruthy();
    expect(screen.queryByTestId('order-view-listing')).toBeNull();
    expect(screen.queryByRole('link', { name: 'View listing' })).toBeNull();
  });

  it('an older order without the snapshot still renders', async () => {
    api.get.mockResolvedValue(legacy());
    renderWithQuery(<OrderDetailPage id="o1" />);
    expect(await screen.findByText('Renamed i1')).toBeTruthy();
    expect(screen.queryByTestId('order-view-listing')).toBeNull();
    expect(screen.queryByTestId('order-payment-summary')).toBeNull();
    expect(screen.getByText('Ali Store (now)')).toBeTruthy();
  });

  it('in Arabic: the Arabic snapshot name and labels', async () => {
    useLocaleStore.getState().setLocale('ar');
    await i18n.changeLanguage('ar');
    try {
      api.get.mockResolvedValue(order());
      renderWithQuery(<OrderDetailPage id="o1" />);
      expect(await screen.findByText('كاميرا قديمة')).toBeTruthy();
      expect(screen.getByTestId('order-view-listing')).toHaveTextContent('عرض المزاد');
      expect(screen.getByTestId('order-payment-summary')).toHaveTextContent(
        'الدفع عند الاستلام · لم يُدفع بعد',
      );
    } finally {
      useLocaleStore.getState().setLocale('en');
      await i18n.changeLanguage('en');
    }
  });
});

describe('sales (seller)', () => {
  it('the sales list card shows the product as bought, the buyer and the total', async () => {
    api.listSales.mockResolvedValue([order()]);
    renderWithQuery(<SalesPage />);
    const name = await screen.findByTestId('order-row-name');
    expect(name).toHaveTextContent('Vintage camera');
    const row = name.closest('a')!;
    expect(row.getAttribute('href')).toBe('/account/selling/sales/o1');
    expect(imageSrc(row)).toContain('thumb.webp');
    expect(row).toHaveTextContent('Buyer: Ali Buyer');
    expect(row).toHaveTextContent('255,000 IQD');
    expect(within(row).getByTestId('order-row-payment')).toHaveTextContent('Cash on delivery');
  });

  it('the sale detail shows the photo, name, price and listing link; legacy still renders', async () => {
    api.get.mockResolvedValue(order());
    const view = renderWithQuery(<SaleDetailPage id="o1" />);
    expect(await screen.findByText('Vintage camera')).toBeTruthy();
    expect(screen.getByTestId('order-view-listing').getAttribute('href')).toBe('/auctions/a1');
    view.unmount();

    api.get.mockResolvedValue(legacy());
    renderWithQuery(<SaleDetailPage id="o1" />);
    expect(await screen.findByText('Renamed i1')).toBeTruthy();
    expect(screen.queryByTestId('order-view-listing')).toBeNull();
  });
});
