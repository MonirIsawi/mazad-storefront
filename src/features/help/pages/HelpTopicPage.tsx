'use client';

import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { ArticleHeader, PageContainer } from '@shared/components/layout';
import { useLocale } from '@shared/hooks';
import { HELP_CONTENT, type HelpTopic } from '../content';
import { HELP_COPY } from '../copy';
import { DraftNotice } from '../components/DraftNotice';
import { HelpBlocks } from '../components/HelpBlocks';
import { LegalPage } from './LegalPage';

export interface HelpTopicPageProps {
  topic: HelpTopic;
  /** The app's way to reach us, when this deployment has one (composed in app/). */
  contact?: ReactNode;
}

/**
 * One help page (design help-topic): the title and its summary, then each section on its own card.
 * Privacy and Terms are the legal page (a summary, then folded clauses).
 */
export function HelpTopicPage({ topic, contact }: HelpTopicPageProps) {
  const { locale } = useLocale();
  if (topic === 'privacy' || topic === 'terms') {
    return <LegalPage topic={topic} contact={contact} />;
  }
  const page = HELP_CONTENT[topic][locale];
  const copy = HELP_COPY[locale];
  return (
    <PageContainer className="pb-10">
      <div className="mx-auto w-full max-w-[820px]">
        <ArticleHeader
          title={page.title}
          backHref={ROUTES.help}
          crumbs={[{ label: copy.help, href: ROUTES.help }]}
        >
          <p className="text-[15px] leading-[1.7] text-pretty text-foreground-soft">
            {page.summary}
          </p>
        </ArticleHeader>
        <article className="mt-4 grid gap-4">
          {page.isDraft ? <DraftNotice text={copy.draftNotice} /> : null}
          {page.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="grid scroll-mt-20 gap-3 rounded-xl border border-border bg-surface p-[18px] text-[15px] leading-[1.7] text-foreground-soft lg:p-[22px]"
            >
              <h2 id={`${section.id}-title`} className="text-h2 font-medium text-foreground">
                {section.heading}
              </h2>
              <HelpBlocks blocks={section.blocks} locale={locale} contact={contact} />
            </section>
          ))}
        </article>
      </div>
    </PageContainer>
  );
}
