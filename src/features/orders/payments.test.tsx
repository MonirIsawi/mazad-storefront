import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import type { ReactNode } from 'react';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { httpClient, setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { paymentsApi } from './api/payments.api';
import { OrderPaymentSection, paymentStateOf } from './components/OrderPaymentSection';
import ordersAr from './i18n/ar.json';
import ordersEn from './i18n/en.json';
import { PaymentsPage } from './pages/PaymentsPage';
import type { OrderPayments, Payment } from './schemas/payments.schema';
import type { Order, OrderStatus } from './types/orders.types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/account/orders/o1',
}));

const realApi = (await vi.importActual<{ paymentsApi: typeof paymentsApi }>('./api/payments.api'))
  .paymentsApi;
vi.mock('./api/payments.api', () => ({
  paymentsApi: { methods: vi.fn(), startSwiftPay: vi.fn(), forOrder: vi.fn(), mine: vi.fn() },
}));
const api = vi.mocked(paymentsApi);

const order = (status: OrderStatus = 'CREATED'): Order => ({
  id: 'o1',
  orderNumber: 'ORD-2026-PAY',
  status,
  subtotal: '45000.00',
  deliveryFee: '5000.00',
  total: '50000.00',
  shipCity: 'Baghdad',
  shipArea: null,
  shipStreet: null,
  shipDetails: null,
  shipPhone: null,
  note: null,
  cancelReason: null,
  createdAt: '2026-10-10T10:00:00.000Z',
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  items: [],
  store: { id: 's1', nameEn: 'Store', nameAr: 'متجر', city: 'Baghdad' },
  seller: { id: 'u2', fullName: 'Seller', isVerified: true },
  customer: null,
});

const payment = (extra: Partial<Payment>): Payment => ({
  id: 'p1',
  orderId: 'o1',
  method: 'SWIFTPAY',
  status: 'PENDING',
  amount: '50000.00',
  currency: 'IQD',
  isLive: false,
  expiresAt: '2026-10-10T11:00:00.000Z',
  paidAt: null,
  failedAt: null,
  refundedAt: null,
  cancelledAt: null,
  createdAt: '2026-10-10T10:00:00.000Z',
  open: true,
  ...extra,
});

const cod = payment({ id: 'cod', method: 'CASH_ON_DELIVERY', open: false });
const payments = (list: Payment[], paidPaymentId: string | null = null): OrderPayments => ({
  orderId: 'o1',
  paidAt: paidPaymentId ? '2026-10-10T10:05:00.000Z' : null,
  paidPaymentId,
  payments: list,
});

function renderUi(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
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
  api.methods.mockResolvedValue({ cashOnDelivery: { enabled: true }, swiftpay: { enabled: true, mode: 'test', currency: 'IQD' } });
});

afterEach(() => {
  setSessionTokens(null);
  vi.restoreAllMocks();
});

describe('payment state comes only from the server records', () => {
  it('reads paid, cash, refunded, awaiting, failed and unpaid', () => {
    expect(paymentStateOf(payments([payment({ status: 'PAID', open: false }), cod], 'p1'))).toBe('paid');
    expect(paymentStateOf(payments([payment({ id: 'cod', method: 'CASH_ON_DELIVERY', status: 'PAID', open: false })], 'cod'))).toBe('paidCash');
    expect(paymentStateOf(payments([payment({ status: 'REFUNDED', open: false })], 'p1'))).toBe('refunded');
    expect(paymentStateOf(payments([payment({}), cod]))).toBe('awaiting');
    // An expired page (open false) is not "awaiting": the buyer can start again.
    expect(paymentStateOf(payments([payment({ open: false }), cod]))).toBe('unpaid');
    expect(paymentStateOf(payments([payment({ status: 'FAILED', open: false }), cod]))).toBe('failed');
    expect(paymentStateOf(payments([cod]))).toBe('unpaid');
  });
});

describe('paymentsApi', () => {
  it('calls the documented mazad-api routes', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({
      data: { paymentId: 'p1', orderId: 'o1', status: 'PENDING', amount: '50000', currency: 'IQD', checkoutUrl: 'https://swiftpayiq.com/pay?slug=x', expiresAt: null, mode: 'test', reused: false },
    });
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: payments([cod]) });
    await realApi.startSwiftPay('o1');
    expect(post).toHaveBeenCalledWith('/orders/o1/payments/swiftpay');
    await realApi.forOrder('o1');
    expect(get).toHaveBeenCalledWith('/orders/o1/payments');
  });
});

describe('OrderPaymentSection (buyer)', () => {
  it('offers cash on delivery by default and the Arabic-labelled SwiftPayIQ option with the IQD amount', async () => {
    api.forOrder.mockResolvedValue(payments([cod]));
    renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    expect(await screen.findByText('Electronic payment via SwiftPayIQ')).toBeTruthy();
    expect((screen.getByLabelText(/^Cash on delivery/) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByTestId('pay-swiftpay')).toBeNull();

    await userEvent.click(screen.getByLabelText(/Electronic payment via SwiftPayIQ/));
    expect(screen.getByText('Test mode: no real money is charged.')).toBeTruthy();
    expect(screen.getByTestId('pay-swiftpay').textContent).toMatch(/Pay .*50,000/);
  });

  it('opens the hosted page in a new tab and only shows "awaiting confirmation" afterwards', async () => {
    const tab = { closed: false, opener: {} as unknown, location: { href: '' }, close: vi.fn() };
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    api.forOrder.mockResolvedValueOnce(payments([cod]));
    api.startSwiftPay.mockResolvedValue({
      paymentId: 'p1', orderId: 'o1', status: 'PENDING', amount: '50000', currency: 'IQD',
      checkoutUrl: 'https://swiftpayiq.com/pay?slug=abc', expiresAt: null, mode: 'test', reused: false,
    });
    api.forOrder.mockResolvedValue(payments([payment({}), cod]));

    renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    await userEvent.click(await screen.findByLabelText(/Electronic payment via SwiftPayIQ/));
    await userEvent.click(screen.getByTestId('pay-swiftpay'));

    await waitFor(() => expect(tab.location.href).toBe('https://swiftpayiq.com/pay?slug=abc'));
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBeNull();
    expect(await screen.findByText('Waiting for SwiftPayIQ to confirm your payment')).toBeTruthy();
    expect(screen.queryByText('Paid electronically')).toBeNull();
  });

  it('shows the server error in words and closes the blank tab', async () => {
    const tab = { closed: false, opener: {}, location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    api.forOrder.mockResolvedValue(payments([cod]));
    api.startSwiftPay.mockRejectedValue(
      Object.assign(new Error('x'), { isAxiosError: true, response: { status: 503, data: { errorCode: 'ELECTRONIC_PAYMENT_DISABLED' } } }),
    );
    renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    await userEvent.click(await screen.findByLabelText(/Electronic payment via SwiftPayIQ/));
    await userEvent.click(screen.getByTestId('pay-swiftpay'));
    expect((await screen.findByRole('alert')).textContent).toMatch(/isn't available right now/);
    expect(tab.close).toHaveBeenCalled();
  });

  it('shows paid, failed (with retry) and hides the choice once paid or delivered', async () => {
    api.forOrder.mockResolvedValue(payments([payment({ status: 'PAID', open: false }), cod], 'p1'));
    const { unmount } = renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    expect(await screen.findByText('Paid electronically')).toBeTruthy();
    expect(screen.queryByTestId('payment-choice')).toBeNull();
    unmount();

    api.forOrder.mockResolvedValue(payments([payment({ status: 'FAILED', open: false }), cod]));
    const failed = renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    expect(await screen.findByText("The payment didn't go through")).toBeTruthy();
    await userEvent.click(screen.getByLabelText(/Electronic payment via SwiftPayIQ/));
    expect(screen.getByTestId('pay-swiftpay').textContent).toBe('Try again');
    failed.unmount();

    api.forOrder.mockResolvedValue(payments([cod]));
    renderUi(<OrderPaymentSection order={order('DELIVERED')} mode="buyer" />);
    await screen.findByText('Amount due');
    expect(screen.queryByTestId('payment-choice')).toBeNull();
  });

  it('reads in Arabic', async () => {
    useLocaleStore.getState().setLocale('ar');
    await i18n.changeLanguage('ar');
    api.forOrder.mockResolvedValue(payments([cod]));
    renderUi(<OrderPaymentSection order={order()} mode="buyer" />);
    expect(await screen.findByText('الدفع الإلكتروني عبر SwiftPayIQ')).toBeTruthy();
    useLocaleStore.getState().setLocale('en');
    await i18n.changeLanguage('en');
  });
});

describe('OrderPaymentSection (seller)', () => {
  it('tells the seller not to collect cash once the buyer paid electronically', async () => {
    api.forOrder.mockResolvedValue(payments([payment({ status: 'PAID', open: false })], 'p1'));
    renderUi(<OrderPaymentSection order={order('CONFIRMED')} mode="seller" />);
    expect(await screen.findByText(/Do not collect cash on delivery/)).toBeTruthy();
    expect(screen.queryByTestId('payment-choice')).toBeNull();
  });
});

describe('PaymentsPage', () => {
  it('lists the buyer payment history linking to each order', async () => {
    api.mine.mockResolvedValue({
      data: [
        { ...payment({ status: 'PAID', open: false, paidAt: '2026-10-10T10:05:00.000Z' }), order: { id: 'o1', orderNumber: 'ORD-2026-PAY', status: 'CREATED', store: { id: 's1', nameEn: 'Store', nameAr: 'متجر' } } },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    renderUi(<PaymentsPage />);
    const row = await screen.findByTestId('payment-row');
    expect(row.textContent).toMatch(/SwiftPayIQ/);
    expect(row.textContent).toMatch(/Paid/);
    expect(row.closest('a')?.getAttribute('href')).toBe('/account/orders/o1');
  });
});
