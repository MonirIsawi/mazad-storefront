'use client';

import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { PageLoader } from '@shared/components/feedback';
import { ArticleHeader, PageContainer } from '@shared/components/layout';
import { useApiFeature } from '@shared/hooks';
import { ChannelList } from '../components/ChannelList';
import { ContactUnavailable } from '../components/ContactUnavailable';
import { ReportForm } from '../components/ReportForm';
import { ReportHistory } from '../components/ReportHistory';
import { ReportSent } from '../components/ReportSent';
import { useSupportContact } from '../hooks/useSupportContact';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import type { CreatedReport, ReportKind } from '../schemas/support.schema';

/**
 * Contact us (design contact): a one-way report or suggestion with a reference and a status, the
 * earlier reports, and the chat channels when this deployment has any. Opened from an order
 * (`?orderId=`), it starts as a problem report about that order. Signed-in only (the route guards).
 */
export function ContactPage({ orderId }: { orderId?: string }) {
  const { t, isReady } = useSupportTranslation();
  const feature = useApiFeature('supportReports');
  const { channels } = useSupportContact();
  const [sent, setSent] = useState<{ report: CreatedReport; kind: ReportKind } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const hasChat = channels.length > 0;

  if (!isReady || feature === undefined) return <PageLoader />;
  return (
    <PageContainer className="pb-10">
      <ArticleHeader
        title={t('page.title')}
        backHref={ROUTES.help}
        crumbs={[{ label: t('page.help'), href: ROUTES.help }]}
      >
        {feature ? (
          <p className="max-w-[70ch] text-[15px] leading-[1.7] text-foreground-soft">
            {hasChat ? t('page.introWithChat') : t('page.intro')}
          </p>
        ) : null}
      </ArticleHeader>
      {feature ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {hasChat ? (
            <div className="lg:col-start-2 lg:row-start-1">
              <ChannelList channels={channels} />
            </div>
          ) : null}
          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            {sent ? (
              <ReportSent
                report={sent.report}
                kind={sent.kind}
                onAnother={() => {
                  setSent(null);
                  setFormKey((key) => key + 1);
                }}
              />
            ) : (
              <ReportForm
                key={formKey}
                linkedOrderId={formKey === 0 ? orderId : undefined}
                hasChat={hasChat}
                onSent={(report, kind) => setSent({ report, kind })}
              />
            )}
          </div>
          <div className="lg:col-start-2">
            <ReportHistory />
          </div>
        </div>
      ) : (
        <div className="mt-2 grid gap-4">
          <ContactUnavailable />
          <ChannelList channels={channels} />
        </div>
      )}
    </PageContainer>
  );
}
