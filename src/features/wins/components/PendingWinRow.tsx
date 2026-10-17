'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Badge, Button, Card, Icon, Price } from '@shared/components/ui';
import { useCountdown, useLocale } from '@shared/hooks';
import { cn, formatDuration, pickLocalizedName } from '@shared/lib';
import { useDeclineWin } from '../hooks/useConfirmWins';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { Win } from '../types/wins.types';

/** A win waiting for confirmation: select it, see the deadline, or decline it. */
export function PendingWinRow({
  win,
  isSelected,
  onToggle,
}: {
  win: Win;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { t } = useWinsTranslation();
  const { locale } = useLocale();
  const decline = useDeclineWin();
  // Ticks every second on the shared interval, anchored to the server clock (ADR-013).
  const remainingMs = useCountdown(win.confirmationDeadline);
  const name = pickLocalizedName(win.auction.product, locale);
  const hasExpired = remainingMs <= 0;

  return (
    <Card isInset className="grid gap-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={name}
          onClick={onToggle}
          disabled={hasExpired}
          className={cn(
            'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full disabled:opacity-45',
            isSelected ? 'bg-grad text-gold-ink' : 'border-[1.5px] border-border-strong',
          )}
        >
          {isSelected ? <Icon name="check" size={14} /> : null}
        </button>
        <div className="grid min-w-0 flex-1 gap-1">
          <Link
            href={ROUTES.auctionDetail(win.auctionId)}
            className="truncate font-medium text-foreground"
          >
            {name}
          </Link>
          <Price value={win.amount} tone="gold" size="md" />
        </div>
        <Badge tone={hasExpired ? 'done' : 'ending'}>{t(`status.${win.status}`)}</Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-tabular text-[13px] text-muted-foreground">
          <Icon name="clock" size={14} />
          {hasExpired
            ? t('card.expired')
            : `${t('card.deadline')} ${formatDuration(remainingMs, locale)}`}
        </span>
        <Button
          variant="plain"
          size="sm"
          isLoading={decline.isPending}
          onClick={() => {
            if (window.confirm(t('confirm.declineConfirm'))) decline.mutate(win.id);
          }}
        >
          {t('confirm.decline')}
        </Button>
      </div>
    </Card>
  );
}
