'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@shared/components/ui';
import { getErrorCode } from '@shared/lib';
import { autoBidFormSchema } from '../schemas/bidding.schema';
import { useSetAutoBid } from '../hooks/useSetAutoBid';
import { useCancelAutoBid } from '../hooks/useCancelAutoBid';
import { useMyStanding } from '../hooks/useMyStanding';
import { useMoney } from '@shared/hooks';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { AutoBidFormValues } from '../types/bidding.types';

export interface AutoBidControlProps {
  auctionId: string;
}

/**
 * Collapsed "Set up auto-bid", the maximum field, or "Auto-bid active up to X" with Change and
 * Turn off. The active state is the server's (GET /auctions/:id/me), so it survives a reload, and
 * says when the price has passed the maximum.
 */
export function AutoBidControl({ auctionId }: AutoBidControlProps) {
  const { t } = useBiddingTranslation();
  const { t: tCommon } = useTranslation('common');
  const { money } = useMoney();
  const active = useMyStanding(auctionId)?.autoBid ?? null;
  const [isExpanded, setIsExpanded] = useState(false);
  const setAutoBid = useSetAutoBid(auctionId);
  const cancelAutoBid = useCancelAutoBid(auctionId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AutoBidFormValues>({ resolver: zodResolver(autoBidFormSchema) });

  const errorCode = getErrorCode(setAutoBid.error) ?? getErrorCode(cancelAutoBid.error);

  const onSubmit = handleSubmit((values) => {
    setAutoBid.mutate(values.maxAmount, {
      onSuccess: () => setIsExpanded(false),
    });
  });

  if (active && !isExpanded) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span
          className={active.exhausted ? 'text-destructive' : 'text-foreground-soft'}
          data-testid="auto-bid-active"
        >
          {t(active.exhausted ? 'autoBid.exhausted' : 'autoBid.active', {
            amount: money(active.maxAmount),
          })}
        </span>
        <span className="flex gap-1">
          <Button variant="plain" size="sm" onClick={() => setIsExpanded(true)}>
            {t('autoBid.change')}
          </Button>
          <Button
            variant="plain"
            size="sm"
            isLoading={cancelAutoBid.isPending}
            onClick={() => cancelAutoBid.mutate(undefined)}
          >
            {t('autoBid.cancel')}
          </Button>
        </span>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button variant="plain" size="sm" onClick={() => setIsExpanded(true)}>
        {t('autoBid.setUp')}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <Input
        label={t('autoBid.maxAmount')}
        type="number"
        step="0.01"
        error={errors.maxAmount ? t(errors.maxAmount.message ?? '') : undefined}
        {...register('maxAmount', { valueAsNumber: true })}
      />
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={setAutoBid.isPending}>
          {t('autoBid.submit')}
        </Button>
        <Button type="button" variant="plain" size="sm" onClick={() => setIsExpanded(false)}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
