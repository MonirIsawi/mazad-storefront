import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HELP_CONTENT, HELP_TOPICS } from './content';
import { HelpTopicPage } from './HelpPages';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

describe('help and policy pages', () => {
  it('every page exists in Arabic and English with the same sections', () => {
    for (const topic of HELP_TOPICS) {
      const { ar, en } = HELP_CONTENT[topic];
      expect({ topic, sections: ar.sections.length }).toEqual({
        topic,
        sections: en.sections.length,
      });
      expect(ar.isDraft).toBe(en.isDraft);
    }
  });

  it('privacy and terms are marked as drafts pending legal review; the rest are not', () => {
    expect(HELP_TOPICS.filter((topic) => HELP_CONTENT[topic].en.isDraft)).toEqual([
      'privacy',
      'terms',
    ]);
    render(<HelpTopicPage topic="privacy" />);
    expect(screen.getByTestId('help-draft')).toBeTruthy();
  });

  it('describes both payment methods, never cash only', () => {
    const text = JSON.stringify(HELP_CONTENT.payments);
    expect(text).toMatch(/Cash on delivery/);
    expect(text).toMatch(/Card/);
    expect(text).toMatch(/الدفع عند الاستلام/);
    expect(text).toMatch(/بالبطاقة/);
  });
});
