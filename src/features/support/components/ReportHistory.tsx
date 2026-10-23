'use client';

import { Badge, Button, Icon, Skeleton, type BadgeTone } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useMyReports } from '../hooks/useMyReports';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import type { MyReport, ReportStatus } from '../schemas/support.schema';
import { KIND_ICONS } from './KindPicker';

const STATUS_TONE: Record<ReportStatus, BadgeTone> = {
  RECEIVED: 'done',
  IN_REVIEW: 'ending',
  RESOLVED: 'live',
};

function ReportRow({ report }: { report: MyReport }) {
  const { t } = useSupportTranslation();
  const { locale } = useLocale();
  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[22px] border border-border bg-surface px-3.5 py-2.5">
      <span aria-hidden className="grid size-11 place-items-center rounded-[14px] border bg-tile">
        <Icon name={KIND_ICONS[report.kind]} size={24} tone="gold" />
      </span>
      <span className="grid min-w-0 gap-0.5 leading-[1.35]">
        <span className="sr-only">{t(`form.kind.${report.kind}`)}: </span>
        <span className="line-clamp-2 text-[15px] font-medium break-words text-foreground">
          {report.message}
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          <bdi className="font-num">{report.reference}</bdi>
          {report.orderNumber ? (
            <>
              {' · '}
              <bdi className="font-num">{report.orderNumber}</bdi>
            </>
          ) : null}
          {' · '}
          {formatDate(report.createdAt, locale)}
        </span>
      </span>
      <Badge tone={STATUS_TONE[report.status]}>{t(`history.status.${report.status}`)}</Badge>
    </li>
  );
}

/** My earlier reports with their status only (received, in review, resolved): not a chat. */
export function ReportHistory() {
  const { t } = useSupportTranslation();
  const { reports, isPending, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMyReports();

  return (
    <section aria-labelledby="report-history-title" className="grid content-start gap-2.5">
      <h2
        id="report-history-title"
        className="px-1.5 text-[13px] font-normal text-muted-foreground"
      >
        {t('history.title')}
      </h2>
      {isPending ? (
        <div className="grid gap-2" aria-hidden>
          <Skeleton className="h-[66px] rounded-[22px]" />
          <Skeleton className="h-[66px] rounded-[22px]" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-border bg-surface px-4 py-3 text-[13.5px] text-foreground-soft">
          <span>{t('history.loadError')}</span>
          <Button variant="soft" size="sm" onClick={() => void refetch()}>
            {t('history.retry')}
          </Button>
        </div>
      ) : reports.length === 0 ? (
        <p className="px-1.5 text-[13.5px] text-foreground-soft">{t('history.empty')}</p>
      ) : (
        <ul className="grid gap-2" data-testid="report-history">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      )}
      {hasNextPage ? (
        <Button
          variant="plain"
          size="sm"
          isLoading={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {t('history.more')}
        </Button>
      ) : null}
    </section>
  );
}
