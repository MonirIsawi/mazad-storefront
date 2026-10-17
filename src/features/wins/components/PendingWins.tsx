'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ROUTES } from '@shared/constants';
import { BottomActionBar } from '@shared/components/ios';
import { Button, Card, Input, Skeleton } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { getErrorCode } from '@shared/lib';
import { useConfirmWins } from '../hooks/useConfirmWins';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { Win } from '../types/wins.types';
import type { WinAddressOption } from '../types/win-order';
import { PendingWinRow } from './PendingWinRow';
import { AddressChoice } from './AddressChoice';

/**
 * Wins still waiting for the buyer. Wins normally become orders by themselves at the default
 * address; one that couldn't (no address at the time, a passed-on win) is confirmed here.
 */
export function PendingWins({
  wins,
  addresses,
  isAddressesPending,
}: {
  wins: Win[];
  addresses: WinAddressOption[];
  isAddressesPending: boolean;
}) {
  const { t } = useWinsTranslation();
  const { number } = useMoney();
  const confirmWins = useConfirmWins();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [addressId, setAddressId] = useState<string | undefined>(undefined);
  const defaultAddressId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id;
  const chosenAddressId = addressId ?? defaultAddressId;
  const confirmError = getErrorCode(confirmWins.error);

  const toggle = (winId: string) =>
    setSelectedIds((current) =>
      current.includes(winId) ? current.filter((id) => id !== winId) : [...current, winId],
    );

  return (
    <section className="grid gap-3">
      <h2 className="font-display text-section text-foreground">{t('sections.pending')}</h2>
      {wins.map((win) => (
        <PendingWinRow
          key={win.id}
          win={win}
          isSelected={selectedIds.includes(win.id)}
          onToggle={() => toggle(win.id)}
        />
      ))}
      <Card isInset className="grid gap-3">
        <h3 className="font-medium text-foreground">{t('confirm.title')}</h3>
        <p className="text-[13px] text-foreground-soft">{t('confirm.description')}</p>
        {isAddressesPending ? (
          <Skeleton radius="md" className="h-12 w-full" />
        ) : addresses.length === 0 ? (
          <p className="text-[13px] text-destructive">
            {t('confirm.noAddress')}{' '}
            <Link href={ROUTES.addressesList} className="font-semibold underline">
              {t('confirm.addAddress')}
            </Link>
          </p>
        ) : (
          <AddressChoice addresses={addresses} value={chosenAddressId} onChange={setAddressId} />
        )}
        <Input
          label={t('confirm.note')}
          placeholder={t('confirm.notePlaceholder')}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {confirmError ? (
          <p role="alert" className="text-[13px] text-destructive">
            {t(`errors.${confirmError}`, { defaultValue: t('errors.WIN_NOT_FOUND') })}
          </p>
        ) : null}
      </Card>
      <BottomActionBar>
        <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">
          {t('confirm.selected', {
            count: selectedIds.length,
            formattedCount: number(selectedIds.length),
          })}
        </span>
        <Button
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
    </section>
  );
}
