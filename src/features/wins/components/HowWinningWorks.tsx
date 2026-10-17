'use client';

import Link from 'next/link';
import { ROUTES } from '@shared/constants';
import { Card, Icon, type IconName } from '@shared/components/ui';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { WinAddressOption } from '../types/win-order';

const POINTS: { key: 'created' | 'change' | 'final'; icon: IconName }[] = [
  { key: 'created', icon: 'package' },
  { key: 'change', icon: 'card' },
  { key: 'final', icon: 'lock' },
];

/** What a win means and what can still change, said plainly (design `.abhow`). */
export function HowWinningWorks({ addresses }: { addresses: WinAddressOption[] }) {
  const { t } = useWinsTranslation();
  const fallback = addresses.find((address) => address.isDefault) ?? addresses[0];

  return (
    <Card isInset className="grid gap-3.5">
      <h2 className="text-h3 font-medium text-foreground">{t('how.title')}</h2>
      <ul className="grid gap-2.5">
        {POINTS.map((point) => (
          <li
            key={point.key}
            className="flex gap-2.5 text-[13.5px] leading-[1.6] text-foreground-soft"
          >
            <Icon name={point.icon} size={18} className="mt-0.5 shrink-0 text-gold" />
            <span>{t(`how.${point.key}`)}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ROUTES.addressesList}
        className="inline-flex items-center gap-1.5 justify-self-start text-[13.5px] font-semibold text-gold underline-offset-4 hover:underline light:text-gold-lo"
      >
        <Icon name="pin" size={16} />
        {fallback
          ? t('how.defaultAddress', { label: fallback.label, city: fallback.city })
          : t('how.noAddress')}
      </Link>
    </Card>
  );
}
