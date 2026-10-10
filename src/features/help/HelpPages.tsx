'use client';

import { ROUTES } from '@shared/constants';
import { ScreenHeader } from '@shared/components/layout';
import { ListRow } from '@shared/components/ios';
import { Card } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { HELP_CONTENT, HELP_TOPICS, type HelpTopic } from './content';

const TITLE = { ar: 'المساعدة والسياسات', en: 'Help & policies' } as const;
const DRAFT_NOTICE = {
  ar: 'مسودة — قيد المراجعة القانونية. قد يتغير هذا النص قبل اعتماده.',
  en: 'Draft — under legal review. This text may change before it is approved.',
} as const;

/** The list of help and policy pages (public). */
export function HelpIndexPage() {
  const { locale } = useLocale();
  return (
    <>
      <ScreenHeader title={TITLE[locale]} backHref={ROUTES.home} />
      <div className="px-gutter pb-6">
        <Card className="overflow-hidden">
          {HELP_TOPICS.map((topic, index) => {
            const page = HELP_CONTENT[topic][locale];
            return (
              <ListRow
                key={topic}
                title={page.title}
                subtitle={page.summary}
                href={ROUTES.helpTopic(topic)}
                isLast={index === HELP_TOPICS.length - 1}
              />
            );
          })}
        </Card>
      </div>
    </>
  );
}

/** One help or policy page; drafts say so before anything else. */
export function HelpTopicPage({ topic }: { topic: HelpTopic }) {
  const { locale } = useLocale();
  const page = HELP_CONTENT[topic][locale];
  return (
    <>
      <ScreenHeader title={page.title} backHref={ROUTES.help} />
      <article className="flex flex-col gap-4 px-gutter pb-6">
        {page.isDraft ? (
          <p
            role="note"
            className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-footnote font-semibold text-foreground"
            data-testid="help-draft"
          >
            {DRAFT_NOTICE[locale]}
          </p>
        ) : null}
        <p className="text-subhead text-foreground-soft">{page.summary}</p>
        {page.sections.map((section) => {
          const items = section.body.filter((line) => line.startsWith('• '));
          const paragraphs = section.body.filter((line) => !line.startsWith('• '));
          return (
            <Card key={section.heading} isInset className="flex flex-col gap-2 text-subhead">
              <h2 className="text-headline font-semibold text-foreground">{section.heading}</h2>
              {paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {items.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1 ps-5">
                  {items.map((text) => (
                    <li key={text}>{text.slice(2)}</li>
                  ))}
                </ul>
              ) : null}
            </Card>
          );
        })}
      </article>
    </>
  );
}
