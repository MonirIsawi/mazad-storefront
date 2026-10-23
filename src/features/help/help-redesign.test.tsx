import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useLocaleStore } from '@shared/store';
import { EXAMPLE_STEP, EXAMPLE_TOP_BID, HELP_CONTENT, HELP_TOPICS } from './content';
import { HELP_COPY } from './copy';
import { searchHelp } from './lib/search';
import { HelpIndexPage } from './pages/HelpIndexPage';
import { HelpTopicPage } from './pages/HelpTopicPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

afterEach(() => useLocaleStore.getState().setLocale('ar'));

/** Arabic letters and their marks (مزادًا, with tanween, is "an auction"). */
const ARABIC_LETTER = /[ء-ٟ]/;

describe('the Bidoom brand in help copy', () => {
  it('names Bidoom, never Mazad, and keeps مزاد only where it means an auction', () => {
    const text = JSON.stringify(HELP_CONTENT);
    expect(text).not.toMatch(/Mazad/);
    expect(text).toMatch(/بيدوم/);
    // A bare مزاد (not المزاد, مزادات, مزادك…) that is left must be "an auction": لكل مزاد
    // ("for each auction": the seller sets the step and the extension for each one).
    const bare = [...text.matchAll(/مزاد/g)].filter((match) => {
      const before = text[match.index - 1] ?? '';
      const after = text[match.index + 4] ?? '';
      const isPrefixed = before === 'ل' && text[match.index - 2] === 'ا';
      return !isPrefixed && !ARABIC_LETTER.test(after) && !ARABIC_LETTER.test(before);
    });
    expect(new Set(bare.map((match) => text.slice(match.index - 4, match.index + 4)))).toEqual(
      new Set(['لكل مزاد']),
    );
  });
});

describe('the bid step, worked through', () => {
  it("is the seller's step, shown before you bid, with a worked example", () => {
    const blocks = HELP_CONTENT['how-auctions-work'].en.sections.find(
      (section) => section.id === 'bidding',
    )?.blocks;
    expect(EXAMPLE_TOP_BID + EXAMPLE_STEP).toBe(1_350_000);
    expect(blocks?.find((block) => block.type === 'example')).toMatchObject({
      rows: [
        { label: 'Top bid now', amount: '1325000' },
        { label: 'Step set by the seller', amount: '25000' },
        { label: 'Lowest bid accepted', amount: '1350000', isResult: true },
      ],
    });
    const text = JSON.stringify(HELP_CONTENT['how-auctions-work']);
    expect(text).toMatch(/The seller sets the bid step for each auction/);
    expect(text).toMatch(/يحدد البائع خطوة المزايدة لكل مزاد/);
    // No platform ladder, and no "Bidoom sets these times".
    expect(text).not.toMatch(/Bidoom sets the step|Bidoom sets these times|تحدد بيدوم/);
    expect(blocks?.some((block) => block.type === 'bullets')).toBe(false);
  });

  it('the seller sets the extension too: N minutes, up to M times', () => {
    const text = JSON.stringify(HELP_CONTENT['how-auctions-work'].en);
    expect(text).toMatch(/The seller also sets how long an extension lasts/);
    expect(text).toMatch(/every bid in the last 5 minutes adds 5 minutes, up to 10 times/i);
  });

  it('lists the four real steps after a win, in order', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpTopicPage topic="how-auctions-work" />);
    const steps = screen.getByRole('list', { name: HELP_COPY.en.stepsLabel });
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'You win when time runs out',
      'Your order is created at once at your default address',
      'The seller confirms and ships',
      'You pay cash on delivery, or by card from the order page',
    ]);
  });
});

describe('the way to reach us on help pages', () => {
  it('says "to be announced" while there is no channel, and gives way to the entry when there is', () => {
    useLocaleStore.getState().setLocale('en');
    const { unmount } = render(<HelpTopicPage topic="faq" />);
    expect(screen.getByText('There is no support channel yet.')).toBeTruthy();
    expect(screen.getByText(/Support contact: to be announced/)).toBeTruthy();
    unmount();

    render(<HelpTopicPage topic="faq" contact={<a href="/contact">Contact us</a>} />);
    expect(screen.queryByText('There is no support channel yet.')).toBeNull();
    expect(screen.queryByText(/Support contact: to be announced/)).toBeNull();
    expect(
      screen.getByText('Return problems reach Bidoom automatically through the return request.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', '/contact');
  });
});

describe('help centre', () => {
  it('lists the seven topics, each with a one-line summary', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpIndexPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('How can we help?');
    const nav = screen.getByRole('navigation', { name: 'Help topics' });
    const topics = within(nav).getAllByRole('link');
    expect(topics.map((link) => link.getAttribute('href'))).toEqual(
      HELP_TOPICS.map((topic) => `/help/${topic}`),
    );
    expect(topics[0]?.textContent).toContain('Bidding, steps, extensions and winning');
  });

  it('searches every page and links straight to the matching section', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpIndexPage contact={<p>reach us</p>} />);
    fireEvent.change(screen.getByLabelText('Search help'), { target: { value: 'prohibited' } });
    const results = screen.getByTestId('help-search-results');
    expect(within(results).getByRole('link', { name: /Prohibited items/ })).toHaveAttribute(
      'href',
      '/help/terms#prohibited-items',
    );
    expect(screen.getByText('reach us')).toBeTruthy();
  });

  it('folds Arabic spelling differences, and finds nothing for nonsense', () => {
    expect(searchHelp('الارجاع', 'ar').some((result) => result.topic === 'returns')).toBe(true);
    expect(searchHelp('zzzz-nothing', 'en')).toEqual([]);
  });
});

describe('Terms and Privacy', () => {
  it('starts with a tab per page, each its own address, and the three-line summary', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpTopicPage topic="terms" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Terms of use');
    const tabs = screen.getByRole('navigation', { name: 'Terms and privacy' });
    expect(within(tabs).getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
      'href',
      '/help/privacy',
    );
    expect(within(screen.getByTestId('legal-tldr')).getAllByRole('listitem')).toHaveLength(3);
  });

  it('folds each clause under its heading: the first open, the others on demand', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpTopicPage topic="privacy" />);
    expect(screen.getAllByRole('button', { expanded: true }).map((b) => b.textContent)).toEqual([
      'About this policy',
    ]);
    const retention = screen.getByRole('button', { name: 'How long we keep data' });
    expect(retention).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(retention);
    expect(retention).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('retention-panel')?.hidden).toBe(false);
  });

  it('opens the clause a link points at', () => {
    useLocaleStore.getState().setLocale('en');
    window.history.replaceState(null, '', '/help/terms#prohibited-items');
    render(<HelpTopicPage topic="terms" />);
    expect(screen.getByRole('button', { name: 'Prohibited items' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    window.history.replaceState(null, '', '/');
  });
});
