'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@shared/components/ui';
import { HELP_COPY } from '../copy';
import type { HelpBlock } from '../content';
import { HelpExample } from './HelpExample';
import { HelpSteps } from './HelpSteps';

export const LINK_CLASS =
  'font-medium text-gold underline decoration-gold-line decoration-1 underline-offset-[3px] hover:decoration-gold light:text-gold-lo';

/** A section's blocks, strictly in the order they are written. */
export function HelpBlocks({
  blocks,
  locale,
  contact,
}: {
  blocks: HelpBlock[];
  locale: 'ar' | 'en';
  /** The app's way to reach us; blocks marked `untilContact` give way to it. */
  contact?: ReactNode;
}) {
  const hasContact = contact != null;
  return blocks.map((block, index) => {
    if (block.untilContact && hasContact) return null;
    const key = `${block.type}-${index}`;
    switch (block.type) {
      case 'paragraph':
        return <p key={key}>{block.text}</p>;
      case 'bullets':
        return (
          <ul key={key} className="flex list-disc flex-col gap-1.5 ps-5 marker:text-gold-lo">
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case 'link':
        return (
          <p key={key}>
            <Link href={block.href} className={LINK_CLASS}>
              {block.text}
            </Link>
          </p>
        );
      case 'pending':
        return (
          <p
            key={key}
            role="note"
            data-testid="help-pending"
            className="rounded-[14px] border border-dashed border-warning/60 px-3.5 py-2.5 text-[13.5px] leading-[1.6] text-foreground-soft"
          >
            <span className="font-semibold text-foreground">{HELP_COPY[locale].pendingLabel}:</span>{' '}
            {block.text}
          </p>
        );
      case 'example':
        return <HelpExample key={key} block={block} label={HELP_COPY[locale].exampleLabel} />;
      case 'steps':
        return <HelpSteps key={key} items={block.items} label={HELP_COPY[locale].stepsLabel} />;
      case 'rule':
        return (
          <p key={key} className="flex gap-2 text-[13px] leading-[1.6] text-foreground-soft">
            <Icon name="lock-simple" size={16} className="mt-[3px] shrink-0 text-gold" />
            <span>{block.text}</span>
          </p>
        );
      case 'contact':
        return hasContact ? <div key={key}>{contact}</div> : null;
    }
  });
}
