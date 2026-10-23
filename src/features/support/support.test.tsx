import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import i18n, { addNamespaceBundle } from '@shared/i18n';
import { probeApiFeature } from '@shared/api/feature-probe';
import { useLocaleStore } from '@shared/store';
import { renderWithQuery } from '@/test/render';
import { supportApi } from './api/support.api';
import { SupportEntry } from './components/SupportEntry';
import supportAr from './i18n/ar.json';
import supportEn from './i18n/en.json';
import { supportChannels } from './lib/channels';
import { ContactPage } from './pages/ContactPage';
import type { MyReport, ReportOrder } from './schemas/support.schema';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/contact',
}));
vi.mock('@shared/api/feature-probe', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  probeApiFeature: vi.fn(),
}));
vi.mock('./api/support.api', () => ({
  supportApi: { send: vi.fn(), myReports: vi.fn(), myOrders: vi.fn(), order: vi.fn() },
}));

const api = vi.mocked(supportApi);
const probe = vi.mocked(probeApiFeature);

const order = (id: string, number: string, name: string): ReportOrder => ({
  id,
  orderNumber: number,
  status: 'OUT_FOR_DELIVERY',
  items: [{ product: { nameEn: name, nameAr: name }, display: null }],
});

const report = (extra: Partial<MyReport>): MyReport => ({
  id: 'r1',
  reference: 'R-7KQ2M9',
  kind: 'PROBLEM',
  status: 'RESOLVED',
  message: 'The parcel arrived two days late.',
  orderId: 'o1',
  orderNumber: 'ORD-24086',
  createdAt: '2026-10-10T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z',
  ...extra,
});

function apiError(status: number, errorCode?: string) {
  const headers = new AxiosHeaders();
  return new AxiosError('failed', String(status), { headers }, null, {
    status,
    statusText: '',
    headers,
    config: { headers },
    data: errorCode ? { statusCode: status, errorCode, message: 'x' } : {},
  });
}

beforeAll(() => {
  addNamespaceBundle('support', 'en', supportEn);
  addNamespaceBundle('support', 'ar', supportAr);
});

beforeEach(async () => {
  useLocaleStore.getState().setLocale('en');
  await i18n.changeLanguage('en');
  probe.mockResolvedValue(true);
  api.myOrders.mockResolvedValue([order('o1', 'ORD-1', 'Phone'), order('o2', 'ORD-2', 'Lamp')]);
  api.myReports.mockResolvedValue({ items: [], nextCursor: null });
});

afterEach(() => vi.clearAllMocks());

async function form() {
  return screen.findByRole('form', { name: 'Report or suggestion' });
}

describe('contact: the report form', () => {
  it('asks for at least 10 characters and sends nothing until then', async () => {
    renderWithQuery(<ContactPage />);
    const user = userEvent.setup();
    await user.type(within(await form()).getByLabelText('What happened?'), 'Too short');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(await screen.findByText('Write at least 10 characters.')).toBeTruthy();
    expect(api.send).not.toHaveBeenCalled();
  });

  it('sends a problem report about an order and shows the reference', async () => {
    api.send.mockResolvedValue({
      id: 'r9',
      reference: 'R-AB12CD',
      status: 'RECEIVED',
      createdAt: '2026-10-17T10:00:00.000Z',
    });
    renderWithQuery(<ContactPage />);
    const user = userEvent.setup();
    const reportForm = await form();
    await waitFor(() => expect(within(reportForm).getByLabelText('Order')).toBeEnabled());
    await user.selectOptions(within(reportForm).getByLabelText('Order'), 'o2');
    await user.type(
      within(reportForm).getByLabelText('What happened?'),
      '  The lamp arrived broken.  ',
    );
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(api.send).toHaveBeenCalledWith({
      kind: 'PROBLEM',
      orderId: 'o2',
      message: 'The lamp arrived broken.',
    });
    const sent = await screen.findByTestId('report-sent');
    expect(within(sent).getByRole('heading', { name: 'We got your report' })).toBeTruthy();
    expect(within(sent).getByTestId('report-reference').textContent).toBe('R-AB12CD');
    expect(within(sent).getByRole('link', { name: 'Back to help' })).toHaveAttribute(
      'href',
      '/help',
    );
  });

  it('sends a suggestion without an order (no order picker)', async () => {
    api.send.mockResolvedValue({
      id: 'r9',
      reference: 'R-AB12CD',
      status: 'RECEIVED',
      createdAt: '2026-10-17T10:00:00.000Z',
    });
    renderWithQuery(<ContactPage orderId="o1" />);
    const user = userEvent.setup();
    await form();
    await user.click(screen.getByRole('radio', { name: 'Suggestion' }));
    expect(screen.queryByLabelText('Order')).toBeNull();
    await user.type(screen.getByLabelText('Your suggestion'), 'An alert an hour before start.');
    await user.click(screen.getByRole('button', { name: 'Send suggestion' }));
    expect(api.send).toHaveBeenCalledWith({
      kind: 'SUGGESTION',
      message: 'An alert an hour before start.',
    });
  });

  it('opened from an order, arrives as a problem report with that order attached', async () => {
    renderWithQuery(<ContactPage orderId="o1" />);
    expect(await screen.findByRole('radio', { name: 'Report a problem' })).toBeChecked();
    await waitFor(() => expect(screen.getByLabelText('Order')).toHaveValue('o1'));
    expect(screen.getByText('Phone')).toBeTruthy();
  });

  it('fetches an attached order that is not among my recent orders', async () => {
    api.order.mockResolvedValue(order('o-old', 'ORD-OLD', 'Old chair'));
    renderWithQuery(<ContactPage orderId="o-old" />);
    await waitFor(() => expect(screen.getByLabelText('Order')).toHaveValue('o-old'));
    expect(api.order).toHaveBeenCalledWith('o-old');
  });

  it('says plainly when the daily limit is reached', async () => {
    api.send.mockRejectedValue(apiError(429, 'SUPPORT_REPORT_LIMIT'));
    renderWithQuery(<ContactPage />);
    const user = userEvent.setup();
    await user.type(
      within(await form()).getByLabelText('What happened?'),
      'Something went wrong here.',
    );
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(
      await screen.findByText(
        'You have sent the most reports allowed for today. Try again tomorrow.',
      ),
    ).toBeTruthy();
  });
});

describe('contact: earlier reports', () => {
  it('lists my reports with their status only', async () => {
    api.myReports.mockResolvedValue({
      items: [
        report({}),
        report({
          id: 'r2',
          reference: 'R-1013XY',
          kind: 'SUGGESTION',
          status: 'IN_REVIEW',
          message: 'An alert an hour before start.',
          orderId: null,
          orderNumber: null,
        }),
      ],
      nextCursor: null,
    });
    renderWithQuery(<ContactPage />);
    const list = await screen.findByTestId('report-history');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain('R-7KQ2M9');
    expect(rows[0]?.textContent).toContain('ORD-24086');
    expect(within(rows[0]!).getByText('Resolved')).toBeTruthy();
    expect(within(rows[1]!).getByText('In review')).toBeTruthy();
  });
});

describe('contact: when the API has no support reports', () => {
  it('shows a clean not-available state, no form', async () => {
    probe.mockResolvedValue(false);
    renderWithQuery(<ContactPage />);
    expect(await screen.findByTestId('contact-unavailable')).toBeTruthy();
    expect(screen.queryByRole('form')).toBeNull();
    expect(api.myReports).not.toHaveBeenCalled();
  });

  it('hides the help centre entry, and shows it once the API has the feature', async () => {
    probe.mockResolvedValue(false);
    const hidden = renderWithQuery(<SupportEntry />);
    await waitFor(() => expect(probe).toHaveBeenCalled());
    expect(screen.queryByTestId('support-entry')).toBeNull();
    hidden.unmount();

    probe.mockResolvedValue(true);
    renderWithQuery(<SupportEntry />);
    expect(await screen.findByRole('link', { name: 'Contact us' })).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});

describe('support chat channels', () => {
  it('come only from config, and only when well formed', () => {
    expect(supportChannels(undefined, undefined)).toEqual([]);
    expect(supportChannels('', '')).toEqual([]);
    expect(supportChannels('07701234567', 'a b')).toEqual([]);
    expect(supportChannels('+9647701234567', '@bidoom_support')).toEqual([
      { id: 'whatsapp', href: 'https://wa.me/9647701234567' },
      { id: 'telegram', href: 'https://t.me/bidoom_support' },
    ]);
  });
});
