import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLocaleStore } from '@shared/store';
import { HELP_CONTENT, HELP_TOPICS, markerOf, type HelpBlock, type ReviewRef } from './content';
import { HelpBlocks } from './components/HelpBlocks';
import { HelpTopicPage } from './pages/HelpTopicPage';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

afterEach(() => useLocaleStore.getState().setLocale('ar'));

/** A block's language-independent shape: kind, list length, link target, review reference. */
function shape(block: HelpBlock) {
  const until = block.untilContact ? ':untilContact' : '';
  switch (block.type) {
    case 'bullets':
      return `bullets:${block.items.length}${until}`;
    case 'link':
      return `link:${block.href}${until}`;
    case 'pending':
      return `pending:${block.ref}${until}`;
    case 'example':
      return `example:${block.rows.map((row) => `${row.amount}${row.isResult ? '*' : ''}`).join()}`;
    case 'steps':
      return `steps:${block.items.map((item) => item.icon).join()}`;
    default:
      return `${block.type}${until}`;
  }
}

function refsOf(topic: (typeof HELP_TOPICS)[number]): ReviewRef[] {
  return HELP_CONTENT[topic].en.sections.flatMap((section) => [
    ...(section.review ? [section.review] : []),
    ...section.blocks.flatMap((block) => (block.type === 'pending' ? [block.ref] : [])),
  ]);
}

describe('help and policy content', () => {
  it('keeps the topic slugs other pages and the mobile app link to', () => {
    expect(HELP_TOPICS).toEqual(
      expect.arrayContaining([
        'how-auctions-work',
        'payments',
        'returns',
        'faq',
        'privacy',
        'terms',
      ]),
    );
  });

  it('has the same structure in Arabic and English: sections, anchors, blocks and references', () => {
    for (const topic of HELP_TOPICS) {
      const { ar, en } = HELP_CONTENT[topic];
      expect(ar.isDraft).toBe(en.isDraft);
      const outline = (page: typeof ar) =>
        page.sections.map((section) => ({
          id: section.id,
          review: section.review,
          blocks: section.blocks.map(shape),
        }));
      expect({ topic, outline: outline(ar) }).toEqual({ topic, outline: outline(en) });
    }
  });

  it('gives every section a unique, URL-safe anchor', () => {
    for (const topic of HELP_TOPICS) {
      const ids = HELP_CONTENT[topic].en.sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('marks only Privacy and Terms as drafts, and keeps legal-review items off the help pages', () => {
    expect(HELP_TOPICS.filter((topic) => HELP_CONTENT[topic].en.isDraft)).toEqual([
      'privacy',
      'terms',
    ]);
    for (const topic of HELP_TOPICS) {
      if (HELP_CONTENT[topic].en.isDraft) continue;
      const legal = refsOf(topic).filter((ref) => markerOf(ref) === 'LEGAL_REVIEW_REQUIRED');
      expect({ topic, legal }).toEqual({ topic, legal: [] });
    }
  });

  it('lists every open item in docs/LEGAL-REVIEW.md, and nothing that is already settled', () => {
    const doc = readFileSync(resolve(process.cwd(), 'docs/LEGAL-REVIEW.md'), 'utf8');
    const documented = new Set(
      [...doc.matchAll(/^### ((?:OD|LR)-\d+):/gm)].map((match) => match[1]),
    );
    const used = new Set(HELP_TOPICS.flatMap(refsOf));
    expect([...used].sort()).toEqual([...documented].sort());
  });

  it('never names card brands, invents contact details or promises a contact channel', () => {
    const text = JSON.stringify(HELP_CONTENT);
    expect(text).not.toMatch(/visa|mastercard|qi ?card|كي كارد|فيزا|ماستر/i);
    expect(text).not.toMatch(/@|https?:\/\/|\+964|\b07\d{9}\b/);
    expect(text).not.toMatch(/contact us|تواصل معنا/i);
  });

  it('describes how winning really works: no confirmation step, no blanket second chance', () => {
    const text = JSON.stringify(HELP_CONTENT['how-auctions-work']);
    expect(text).not.toMatch(/confirm the order and choose/);
    expect(text).not.toMatch(/does not complete the purchase/);
    expect(text).toMatch(/creates the order automatically/);
    expect(text).toMatch(/تُنشئ بيدوم الطلب تلقائيًا/);
  });

  it('violations pause bidding (no automatic ban), and bidders show by full name', () => {
    const text = JSON.stringify(HELP_CONTENT);
    expect(text).not.toMatch(/automatic ban|banned automatically|يُحظر الحساب تلقائيًا/);
    expect(text).toMatch(/two violations pause your bidding/);
    expect(text).toMatch(/ومخالفتان توقفان قدرتك على المزايدة/);
    expect(text).not.toMatch(/anonymous (label|bidder)|اسم مستعار|باسم مستعار/);
    expect(JSON.stringify(HELP_CONTENT.privacy.en)).toMatch(
      /Your full name in bid histories and on your ratings/,
    );
  });

  it('describes both payment methods, never cash only', () => {
    const text = JSON.stringify(HELP_CONTENT.payments);
    expect(text).toMatch(/Cash on delivery/);
    expect(text).toMatch(/Card/);
    expect(text).toMatch(/SwiftPayIQ/);
    expect(text).toMatch(/الدفع عند الاستلام/);
    expect(text).toMatch(/بالبطاقة/);
  });

  it('shows the support placeholder instead of a made-up contact', () => {
    for (const topic of ['faq', 'privacy', 'terms'] as const) {
      for (const locale of ['ar', 'en'] as const) {
        const contact = HELP_CONTENT[topic][locale].sections.find(
          (section) => section.id === 'contact',
        );
        expect(contact?.blocks).toContainEqual(
          expect.objectContaining({ type: 'pending', ref: 'OD-2' }),
        );
      }
    }
    expect(JSON.stringify(HELP_CONTENT.faq.en)).toMatch(/Support contact: to be announced/);
  });
});

describe('help and policy pages', () => {
  it('renders paragraphs, lists, links and notes in the order they are written', () => {
    render(
      <div data-testid="body">
        <HelpBlocks
          locale="en"
          blocks={[
            { type: 'paragraph', text: 'First paragraph' },
            { type: 'bullets', items: ['Item one', 'Item two'] },
            { type: 'paragraph', text: 'After the list' },
            { type: 'pending', ref: 'OD-2', text: 'Support contact: to be announced.' },
            { type: 'link', href: '/help/terms', text: 'Terms' },
          ]}
        />
      </div>,
    );
    const children = [...screen.getByTestId('body').children];
    expect(children.map((element) => element.tagName)).toEqual(['P', 'UL', 'P', 'P', 'P']);
    expect(children.map((element) => element.textContent)).toEqual([
      'First paragraph',
      'Item oneItem two',
      'After the list',
      'To be confirmed: Support contact: to be announced.',
      'Terms',
    ]);
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/help/terms');
  });

  it('keeps the worked step example between the paragraphs that introduce and follow it', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpTopicPage topic="how-auctions-work" />);
    const section = document.getElementById('bidding');
    expect(section).not.toBeNull();
    expect([...section!.children].map((element) => element.tagName)).toEqual([
      'H2',
      'P',
      'FIGURE',
      'P',
      'P',
      'P',
    ]);
  });

  it('has one page heading and one h2 per section, with stable anchors', () => {
    useLocaleStore.getState().setLocale('en');
    render(<HelpTopicPage topic="terms" />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(
      HELP_CONTENT.terms.en.sections.map((section) => section.heading),
    );
    expect(document.getElementById('prohibited-items')).not.toBeNull();
  });

  it('shows one draft notice on Privacy and Terms, and open points as "To be confirmed"', () => {
    useLocaleStore.getState().setLocale('en');
    for (const topic of ['privacy', 'terms'] as const) {
      const { unmount } = render(<HelpTopicPage topic={topic} />);
      expect(screen.getAllByTestId('help-draft')).toHaveLength(1);
      expect(screen.getAllByTestId('help-pending')[0]?.textContent).toMatch(/^To be confirmed:/);
      unmount();
    }
    render(<HelpTopicPage topic="how-auctions-work" />);
    expect(screen.queryByTestId('help-draft')).toBeNull();
  });

  it('renders Arabic pages with the Arabic draft and pending labels', () => {
    render(<HelpTopicPage topic="privacy" />);
    expect(screen.getByTestId('help-draft').textContent).toMatch(/مسودة/);
    expect(screen.getAllByTestId('help-pending')[0]?.textContent).toMatch(/^قيد التأكيد:/);
  });
});
