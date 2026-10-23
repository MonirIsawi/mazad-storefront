'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ROUTES } from '@shared/constants';
import { Button, Card, Icon, buttonVariants } from '@shared/components/ui';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import type { CreatedReport, ReportKind } from '../schemas/support.schema';

/** The confirmation after Send (design `.ctc-done`): the reference to quote, and what happens next. */
export function ReportSent({
  report,
  kind,
  onAnother,
}: {
  report: CreatedReport;
  kind: ReportKind;
  onAnother: () => void;
}) {
  const { t } = useSupportTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <Card
      role="status"
      className="grid justify-items-center gap-3.5 px-[22px] py-[30px] text-center"
      data-testid="report-sent"
    >
      <span
        aria-hidden
        className="grid size-16 place-items-center rounded-full bg-live-soft text-live"
      >
        <Icon name="check" size={30} />
      </span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-h2 font-medium text-foreground outline-none"
      >
        {t(`sent.title.${kind}`)}
      </h2>
      <p className="max-w-[44ch] text-[15px] leading-[1.7] text-foreground-soft">
        {t('sent.reference')}{' '}
        <bdi className="font-num font-semibold text-foreground" data-testid="report-reference">
          {report.reference}
        </bdi>
        . {t('sent.body')}
      </p>
      <div className="grid w-full gap-2 sm:max-w-sm">
        <Link href={ROUTES.help} className={buttonVariants({ variant: 'soft', isFullWidth: true })}>
          {t('sent.back')}
        </Link>
        <Button variant="plain" isFullWidth onClick={onAnother}>
          {t('sent.another')}
        </Button>
      </div>
    </Card>
  );
}
