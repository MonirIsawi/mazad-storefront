import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { setSessionTokens } from '@shared/api';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { ordersApi } from './api/orders.api';
import { paymentsApi } from './api/payments.api';
import { reviewsApi } from './api/reviews.api';
import ordersAr from './i18n/ar.json';
import ordersEn from './i18n/en.json';
import { rateableItem, tagsInBand } from './lib/review-rules';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { orderSchema } from './schemas/orders.schema';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/account/orders/o1',
}));
vi.mock('./api/orders.api', () => ({ ordersApi: { list: vi.fn(), get: vi.fn() } }));
vi.mock('./api/payments.api', () => ({
  paymentsApi: { methods: vi.fn(), forOrder: vi.fn(), startSwiftPay: vi.fn(), mine: vi.fn() },
}));
vi.mock('./api/reviews.api', () => ({ reviewsApi: { create: vi.fn(), update: vi.fn() } }));

const FAR = '2099-01-01T00:00:00.000Z';

/** A delivered order; `review` fields only when the API has store ratings. */
function delivered(reviewFields: Record<string, unknown> | null) {
  return orderSchema.parse({
    id: 'o1',
    orderNumber: 'ORD-2026-RT',
    status: 'DELIVERED',
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
    confirmedAt: '2026-10-01T11:00:00.000Z',
    shippedAt: '2026-10-02T10:00:00.000Z',
    deliveredAt: '2026-10-03T10:00:00.000Z',
    cancelledAt: null,
    items: [
      {
        id: 'i1',
        productId: 'p1',
        finalPrice: '250000.00',
        product: { id: 'p1', nameEn: 'Vintage camera', nameAr: 'كاميرا' },
        win: null,
        returnRequest: null,
        ...(reviewFields ?? {}),
      },
    ],
    store: { id: 's1', nameEn: 'Ali Store', nameAr: 'متجر علي', city: 'Baghdad' },
    seller: { id: 'u2', fullName: 'Seller', isVerified: true },
  });
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
  vi.mocked(reviewsApi.create).mockResolvedValue(undefined);
  vi.mocked(reviewsApi.update).mockResolvedValue(undefined);
});

afterEach(() => setSessionTokens(null));

describe('rating rules', () => {
  it('finds the item to rate only when the API sends canReview', () => {
    expect(rateableItem([{}])).toBeUndefined();
    expect(rateableItem([{ canReview: false, review: null }])).toBeUndefined();
    expect(rateableItem([{ canReview: true, review: null }])).toBeTruthy();
  });

  it('keeps only the tags of the rating band', () => {
    expect(tagsInBand(5, ['AS_DESCRIBED', 'DAMAGED'])).toEqual(['AS_DESCRIBED']);
    expect(tagsInBand(2, ['AS_DESCRIBED', 'DAMAGED'])).toEqual(['DAMAGED']);
  });
});

describe('order-done rating card', () => {
  it('is hidden on an API without ratings (no canReview field)', async () => {
    vi.mocked(ordersApi.get).mockResolvedValue(delivered(null));
    renderWithQuery(<OrderDetailPage id="o1" />);
    await screen.findByText('Vintage camera');
    expect(screen.queryByTestId('rating-card')).toBeNull();
  });

  it('opens the sheet with the tapped stars, switches the tags and posts the rating', async () => {
    vi.mocked(ordersApi.get).mockResolvedValue(
      delivered({ canReview: true, review: null, reviewWindowEndsAt: FAR }),
    );
    const user = userEvent.setup();
    renderWithQuery(<OrderDetailPage id="o1" />);
    const card = await screen.findByTestId('rating-card');
    expect(card).toHaveTextContent('How was your experience with Ali Store?');

    await user.click(within(card).getByRole('button', { name: '5 of 5' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: '5 of 5' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(within(dialog).getByText('What went well?')).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'As described' }));
    await user.click(within(dialog).getByRole('button', { name: 'Fast delivery' }));
    await user.click(within(dialog).getByRole('button', { name: 'Well packed' }));
    // Three is the most: the other tags can't be picked.
    expect(within(dialog).queryByRole('button', { name: 'Good value' })).toBeNull();

    // Down to two stars: problem tags, the praise ones dropped, and a return offered first.
    await user.click(within(dialog).getByRole('radio', { name: '2 of 5' }));
    expect(within(dialog).getByText('What went wrong?')).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: 'Request a return' })).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Arrived damaged' }));
    await user.type(within(dialog).getByLabelText(/Tell other buyers more/), ' Box was crushed ');
    await user.click(within(dialog).getByTestId('rate-submit'));

    expect(reviewsApi.create).toHaveBeenCalledWith('i1', {
      rating: 2,
      tags: ['DAMAGED'],
      comment: 'Box was crushed',
    });
  });

  it('shows a posted rating with an edit that patches it', async () => {
    vi.mocked(ordersApi.get).mockResolvedValue(
      delivered({
        canReview: false,
        review: { id: 'r1', rating: 4, tags: ['FAST_DELIVERY'], comment: null, editableUntil: FAR },
        reviewWindowEndsAt: FAR,
      }),
    );
    const user = userEvent.setup();
    renderWithQuery(<OrderDetailPage id="o1" />);
    const card = await screen.findByTestId('rating-card');
    expect(card).toHaveTextContent('Thanks, your rating is live');

    await user.click(within(card).getByRole('button', { name: /Edit your rating/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByTestId('rate-submit'));
    expect(reviewsApi.update).toHaveBeenCalledWith('r1', {
      rating: 4,
      tags: ['FAST_DELIVERY'],
      comment: null,
    });
  });
});
