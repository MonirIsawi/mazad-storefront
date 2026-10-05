'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Button, Card, Icon, Input, SectionHeader, Skeleton } from '@shared/components/ui';
import { BottomActionBar, ListRow } from '@shared/components/ios';
import { useCountdown, useLocale, useMoney } from '@shared/hooks';
import { formatDuration, getErrorCode, pickLocalizedName } from '@shared/lib';
import { useWins } from '../hooks/useWins';
import { useConfirmWins, useDeclineWin } from '../hooks/useConfirmWins';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { Win } from '../types/wins.types';

/** Structurally satisfied by the addresses feature's `Address` — kept local so wins doesn't
 *  import from another feature slice (AGENTS.md rule 1); the route passes them in. */
export interface WinAddressOption {
  id: string;
  label: string;
  city: string;
  isDefault: boolean;
}

export interface WinsPageProps {
  addresses?: WinAddressOption[];
  isAddressesPending?: boolean;
}

export function WinsPage({ addresses = [], isAddressesPending = false }: WinsPageProps) {
  const { t, isReady } = useWinsTranslation();
  const { number } = useMoney();
  const wins = useWins();
  const confirmWins = useConfirmWins();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [addressId, setAddressId] = useState<string | undefined>(undefined);

  if (!isReady) return <PageLoader />;

  const pending = (wins.data ?? []).filter((win) => win.status === 'PENDING_CONFIRMATION');
  const settled = (wins.data ?? []).filter((win) => win.status !== 'PENDING_CONFIRMATION');

  const defaultAddressId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;
  const chosenAddressId = addressId ?? defaultAddressId;

  const toggleSelected = (winId: string) =>
    setSelectedIds((current) =>
      current.includes(winId) ? current.filter((id) => id !== winId) : [...current, winId],
    );

  const confirmError = getErrorCode(confirmWins.error);

  return (
    <>
      <ScreenHeader title={t('page.title')} backHref={ROUTES.account} />

      <div className="flex flex-col gap-5 px-gutter pb-28">
        {wins.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} radius="lg" className="h-24 w-full" />
            ))}
          </div>
        ) : wins.isError ? (
          <ErrorState onRetry={() => void wins.refetch()} />
        ) : pending.length === 0 && settled.length === 0 ? (
          <EmptyState
            icon="badge-check"
            title={t('page.emptyTitle')}
            message={t('page.empty')}
            action={
              <Link
                href={ROUTES.auctions}
                className="mt-2 text-subhead font-semibold text-primary-text"
              >
                {t('page.title')}
              </Link>
            }
          />
        ) : (
          <>
            {pending.length > 0 ? (
              <section>
                <SectionHeader title={t('sections.pending')} />
                <div className="flex flex-col gap-3">
                  {pending.map((win) => (
                    <WinCard
                      key={win.id}
                      win={win}
                      isSelected={selectedIds.includes(win.id)}
                      onToggleSelected={() => toggleSelected(win.id)}
                    />
                  ))}
                </div>

                <Card isInset className="mt-4 flex flex-col gap-3">
                  <p className="text-subhead font-semibold text-foreground">{t('confirm.title')}</p>
                  <p className="text-footnote text-muted-foreground">{t('confirm.description')}</p>

                  {isAddressesPending ? (
                    <Skeleton radius="md" className="h-12 w-full" />
                  ) : addresses.length === 0 ? (
                    <p className="text-footnote text-destructive">
                      {t('confirm.noAddress')}{' '}
                      <Link href={ROUTES.addressesList} className="font-semibold underline">
                        {t('confirm.addAddress')}
                      </Link>
                    </p>
                  ) : (
                    <div className="-mx-4 overflow-hidden">
                      {addresses.map((address, index) => (
                        <ListRow
                          key={address.id}
                          icon="map-pin"
                          title={address.label}
                          subtitle={address.city}
                          hasChevron={false}
                          isLast={index === addresses.length - 1}
                          onClick={() => setAddressId(address.id)}
                          value={
                            chosenAddressId === address.id ? (
                              <Icon name="check" size={18} className="text-primary" />
                            ) : undefined
                          }
                        />
                      ))}
                    </div>
                  )}

                  <Input
                    label={t('confirm.note')}
                    placeholder={t('confirm.notePlaceholder')}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />

                  {confirmError ? (
                    <p role="alert" className="text-footnote text-destructive">
                      {t(`errors.${confirmError}`, { defaultValue: t('errors.WIN_NOT_FOUND') })}
                    </p>
                  ) : null}
                </Card>
              </section>
            ) : null}

            {settled.length > 0 ? (
              <section>
                <SectionHeader title={t('sections.settled')} />
                <div className="flex flex-col gap-3">
                  {settled.map((win) => (
                    <WinCard key={win.id} win={win} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      {pending.length > 0 ? (
        <BottomActionBar>
          <span className="min-w-0 flex-1 text-footnote text-muted-foreground">
            {t('confirm.selected', {
              count: selectedIds.length,
              formattedCount: number(selectedIds.length),
            })}
          </span>
          <Button
            size="lg"
            hasShadow
            className="flex-[1.3]"
            disabled={selectedIds.length === 0 || !chosenAddressId}
            isLoading={confirmWins.isPending}
            onClick={() => {
              if (!chosenAddressId) return;
              confirmWins.mutate(
                { winIds: selectedIds, addressId: chosenAddressId, note: note.trim() || undefined },
                { onSuccess: () => setSelectedIds([]) },
              );
            }}
          >
            {t('confirm.submit')}
          </Button>
        </BottomActionBar>
      ) : null}
    </>
  );
}

function WinCard({
  win,
  isSelected,
  onToggleSelected,
}: {
  win: Win;
  isSelected?: boolean;
  onToggleSelected?: () => void;
}) {
  const { t } = useWinsTranslation();
  const { locale } = useLocale();
  const { money } = useMoney();
  const decline = useDeclineWin();
  // Ticks every second on the shared interval, anchored to the server clock (ADR-013).
  const remainingMs = useCountdown(win.confirmationDeadline);

  const name = pickLocalizedName(win.auction.product, locale);
  const isPending = win.status === 'PENDING_CONFIRMATION';
  const hasExpired = isPending && remainingMs <= 0;

  return (
    <Card isInset className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {onToggleSelected ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-label={name}
            onClick={onToggleSelected}
            disabled={hasExpired}
            className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-primary-foreground disabled:opacity-45 aria-checked:border-primary aria-checked:bg-primary"
          >
            {isSelected ? <Icon name="check" size={14} /> : null}
          </button>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={ROUTES.auctionDetail(win.auctionId)}
            className="truncate text-subhead font-semibold text-foreground"
          >
            {name}
          </Link>
          <span className="text-callout font-bold text-foreground tabular-nums">
            {money(win.amount)}
          </span>
        </div>

        <Badge tone={isPending ? (hasExpired ? 'neutral' : 'warning') : 'neutral'}>
          {t(`status.${win.status}`)}
        </Badge>
      </div>

      {isPending ? (
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-footnote text-muted-foreground tabular-nums">
            <Icon name="clock" size={14} />
            {hasExpired
              ? t('card.expired')
              : `${t('card.deadline')} ${formatDuration(remainingMs)}`}
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
      ) : win.orderItem ? (
        <Link
          href={ROUTES.orderDetail(win.orderItem.orderId)}
          className="text-subhead font-semibold text-primary-text"
        >
          {t('card.viewOrder')}
        </Link>
      ) : null}
    </Card>
  );
}
