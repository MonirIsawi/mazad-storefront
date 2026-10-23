'use client';

import type { ReactNode } from 'react';
import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import type { HelpSection } from '../content';
import { useOpenSections } from '../hooks/useOpenSections';
import { HelpBlocks } from './HelpBlocks';

/**
 * Each clause folded under its plain heading (design `.acc.legal`), numbered, the first one open.
 * A link to a clause (`/help/terms#prohibited-items`) opens it. The WAI-ARIA accordion: a button
 * inside each h2, with the state on the button.
 */
export function LegalAccordion({
  sections,
  locale,
  contact,
}: {
  sections: HelpSection[];
  locale: 'ar' | 'en';
  contact?: ReactNode;
}) {
  const { isOpen, toggle } = useOpenSections(sections.map((section) => section.id));
  return (
    <div className="rounded-xl border border-border bg-surface px-[18px] py-1 [counter-reset:clause] lg:px-[22px]">
      {sections.map((section) => {
        const open = isOpen(section.id);
        return (
          <div
            key={section.id}
            id={section.id}
            className="scroll-mt-20 border-b border-border [counter-increment:clause] last:border-b-0"
          >
            <h2 className="text-[14.5px] font-medium text-foreground">
              <button
                type="button"
                id={`${section.id}-button`}
                aria-expanded={open}
                aria-controls={`${section.id}-panel`}
                onClick={() => toggle(section.id)}
                className="flex min-h-[52px] w-full items-center gap-3 py-2 text-start"
              >
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-raised font-num text-[12.5px] text-gold before:content-[counter(clause)] light:text-gold-lo"
                />
                <span className="min-w-0 flex-1">{section.heading}</span>
                <Icon
                  name="caret-down"
                  size={16}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform duration-300 ease-ios',
                    open && 'rotate-180',
                  )}
                />
              </button>
            </h2>
            <div
              id={`${section.id}-panel`}
              hidden={!open}
              className="grid gap-3 pb-4 text-[15px] leading-[1.8] text-foreground-soft"
            >
              <HelpBlocks blocks={section.blocks} locale={locale} contact={contact} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
