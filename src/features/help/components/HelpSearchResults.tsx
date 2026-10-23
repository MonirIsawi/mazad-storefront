import { ROUTES } from '@shared/constants';
import { MenuRow } from '@shared/components/ui';
import { HELP_TOPIC_ICONS } from '../content';
import type { HelpCopy } from '../copy';
import type { HelpSearchResult } from '../lib/search';

/** What the help search found: each hit opens its page at the matching section. */
export function HelpSearchResults({
  query,
  results,
  copy,
}: {
  query: string;
  results: HelpSearchResult[];
  copy: HelpCopy;
}) {
  return (
    <div className="grid gap-2.5" data-testid="help-search-results">
      <p role="status" className="px-1 text-[13px] text-muted-foreground">
        {results.length ? copy.searchResults(results.length) : copy.searchEmpty(query)}
      </p>
      {results.length ? (
        <ul className="grid gap-2 lg:gap-2.5">
          {results.map((result) => {
            const href = ROUTES.helpTopic(result.topic);
            return (
              <li key={`${result.topic}-${result.sectionId ?? 'page'}`}>
                <MenuRow
                  icon={HELP_TOPIC_ICONS[result.topic]}
                  title={result.title}
                  subtitle={result.context}
                  href={result.sectionId ? `${href}#${result.sectionId}` : href}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
