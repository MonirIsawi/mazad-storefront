'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ROUTES } from '@shared/constants';
import { ArticleHeader, PageContainer } from '@shared/components/layout';
import { MenuRow, SearchField } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { HELP_CONTENT, HELP_TOPICS, HELP_TOPIC_ICONS } from '../content';
import { HELP_COPY } from '../copy';
import { HelpSearchResults } from '../components/HelpSearchResults';
import { searchHelp } from '../lib/search';

/**
 * The help centre (design help): the seven topics, each with a one-line summary, a search across
 * every page, and at the end a way to reach us when this deployment has one (`contact`, composed
 * in app/).
 */
export function HelpIndexPage({ contact }: { contact?: ReactNode }) {
  const { locale } = useLocale();
  const copy = HELP_COPY[locale];
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchHelp(query, locale), [query, locale]);
  const isSearching = query.trim().length > 0;

  return (
    <PageContainer className="pb-10">
      <div className="mx-auto w-full max-w-[820px]">
        <ArticleHeader
          title={copy.indexHeading}
          barTitle={copy.indexBar}
          backHref={ROUTES.account}
          crumbs={[{ label: copy.account, href: ROUTES.account }]}
          currentCrumb={copy.help}
          isDisplay
        />
        <div className="mt-4 grid gap-4">
          <SearchField
            value={query}
            onChange={setQuery}
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            clearLabel={copy.searchClear}
          />
          {isSearching ? (
            <HelpSearchResults query={query.trim()} results={results} copy={copy} />
          ) : (
            <nav aria-label={copy.topicsLabel}>
              <ul className="grid gap-2 lg:gap-2.5">
                {HELP_TOPICS.map((topic) => {
                  const page = HELP_CONTENT[topic][locale];
                  return (
                    <li key={topic}>
                      <MenuRow
                        icon={HELP_TOPIC_ICONS[topic]}
                        title={page.title}
                        subtitle={page.blurb}
                        href={ROUTES.helpTopic(topic)}
                      />
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          {contact}
        </div>
      </div>
    </PageContainer>
  );
}
