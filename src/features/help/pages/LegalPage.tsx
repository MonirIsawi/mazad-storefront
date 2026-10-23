'use client';

import type { ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { ArticleHeader, PageContainer } from '@shared/components/layout';
import { useLocale } from '@shared/hooks';
import { HELP_CONTENT, LEGAL_TLDR_ICONS } from '../content';
import { HELP_COPY } from '../copy';
import { DraftNotice } from '../components/DraftNotice';
import { LegalAccordion } from '../components/LegalAccordion';
import { LegalTabs, type LegalTopic } from '../components/LegalTabs';
import { TldrCard } from '../components/TldrCard';

/**
 * Terms and Privacy (design legal): a tab each, with its own address; the draft notice; three lines
 * that say what matters most; then every clause folded under a plain heading.
 */
export function LegalPage({ topic, contact }: { topic: LegalTopic; contact?: ReactNode }) {
  const { locale } = useLocale();
  const page = HELP_CONTENT[topic][locale];
  const copy = HELP_COPY[locale];
  return (
    <PageContainer className="pb-10">
      <div className="mx-auto w-full max-w-[820px]">
        <ArticleHeader
          title={copy.legalTitles[topic]}
          backHref={ROUTES.help}
          crumbs={[{ label: copy.help, href: ROUTES.help }]}
          currentCrumb={copy.legalCrumb}
        >
          <p className="text-[13px] text-muted-foreground">{page.summary}</p>
        </ArticleHeader>
        <article className="mt-4 grid gap-4">
          <LegalTabs current={topic} labels={copy.legalTabs} navLabel={copy.legalTabsLabel} />
          {page.isDraft ? <DraftNotice text={copy.draftNotice} /> : null}
          {page.tldr ? (
            <TldrCard title={copy.inShort} lines={page.tldr} icons={LEGAL_TLDR_ICONS[topic]} />
          ) : null}
          <LegalAccordion key={topic} sections={page.sections} locale={locale} contact={contact} />
          {contact ? <div className="px-1 text-[13px] text-muted-foreground">{contact}</div> : null}
        </article>
      </div>
    </PageContainer>
  );
}
