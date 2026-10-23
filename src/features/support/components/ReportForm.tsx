'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardTitle, Textarea } from '@shared/components/ui';
import { getErrorCode, getErrorStatus } from '@shared/lib';
import { useReportOrders } from '../hooks/useReportOrders';
import { useSendReport } from '../hooks/useSendReport';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import {
  MESSAGE_MAX,
  reportFormSchema,
  type CreatedReport,
  type ReportFormValues,
  type ReportKind,
} from '../schemas/support.schema';
import { KindPicker } from './KindPicker';
import { OrderField } from './OrderField';

const KNOWN_ERRORS = ['SUPPORT_REPORT_LIMIT', 'ORDER_NOT_FOUND'];

function errorKey(error: unknown): string {
  const code = getErrorCode(error);
  if (code && KNOWN_ERRORS.includes(code)) return `form.errors.${code}`;
  if (getErrorStatus(error) === 429) return 'form.errors.TOO_MANY_REQUESTS';
  return 'form.errors.generic';
}

export interface ReportFormProps {
  /** The order the form was opened from (`?orderId=`): a problem report about that order. */
  linkedOrderId?: string;
  hasChat: boolean;
  onSent: (report: CreatedReport, kind: ReportKind) => void;
}

/** The one-way report or suggestion (design contact form): kind, the order it's about, the message. */
export function ReportForm({ linkedOrderId, hasChat, onSent }: ReportFormProps) {
  const { t } = useSupportTranslation();
  const send = useSendReport();
  const orders = useReportOrders(linkedOrderId);
  const { register, handleSubmit, control, setValue, formState } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { kind: 'PROBLEM', orderId: linkedOrderId ?? '', message: '' },
  });
  const [kind, orderId, message] = useWatch({ control, name: ['kind', 'orderId', 'message'] });
  const length = (message ?? '').trim().length;

  // Once the linked order is known, select it (or let it go when it isn't one of mine).
  const { isLinkedSettled, linkedOrder } = orders;
  useEffect(() => {
    if (linkedOrderId && isLinkedSettled) setValue('orderId', linkedOrder?.id ?? '');
  }, [linkedOrderId, isLinkedSettled, linkedOrder, setValue]);

  const onSubmit = handleSubmit((values) => {
    if (send.isPending) return;
    const withOrder = values.kind !== 'SUGGESTION' && values.orderId ? values.orderId : undefined;
    send.mutate(
      { kind: values.kind, message: values.message, ...(withOrder ? { orderId: withOrder } : {}) },
      { onSuccess: (report) => onSent(report, values.kind) },
    );
  });

  const messageError = formState.errors.message?.message;
  return (
    <Card className="grid content-start gap-4 p-[18px] lg:p-[22px]">
      <div className="grid gap-1">
        <CardTitle className="p-0">{t('form.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {hasChat ? t('form.subtitleWithChat') : t('form.subtitle')}
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-label={t('form.title')}>
        <KindPicker
          legend={t('form.kindLabel')}
          labels={{
            PROBLEM: t('form.kind.PROBLEM'),
            SUGGESTION: t('form.kind.SUGGESTION'),
            OTHER: t('form.kind.OTHER'),
          }}
          field={register('kind')}
        />
        {kind !== 'SUGGESTION' ? (
          <OrderField
            orders={orders.orders}
            isLoading={orders.isLoading}
            selectedId={orderId}
            field={register('orderId')}
          />
        ) : null}
        <Textarea
          label={t(`form.message.${kind}`)}
          placeholder={t(`form.placeholder.${kind}`)}
          rows={5}
          maxLength={MESSAGE_MAX}
          error={messageError ? t(messageError) : undefined}
          hint={t('form.count', { count: length, max: MESSAGE_MAX })}
          {...register('message')}
        />
        {send.isError ? (
          <p role="alert" className="text-[13.5px] text-destructive">
            {t(errorKey(send.error))}
          </p>
        ) : null}
        <Button type="submit" isFullWidth isLoading={send.isPending}>
          {t(`form.submit.${kind}`)}
        </Button>
      </form>
    </Card>
  );
}
