'use client';

import Link from 'next/link';
import { useMoney } from '@shared/hooks';
import { cn } from '@shared/lib';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';

export interface AccountCounter {
  key: string;
  href: string;
  label: string;
  /** Undefined while loading or when the API can't say: shown as a dash, never a guess. */
  value: number | undefined;
  isGold?: boolean;
}

/** Three live counts that link to what needs the user (design `.stats`). */
export function AccountCounters({ counters }: { counters: AccountCounter[] }) {
  const { t } = useAuthTranslation();
  const { number } = useMoney();
  return (
    <nav aria-label={t('account.counters')}>
      <ul className="grid grid-cols-3 gap-2.5">
        {counters.map((counter) => (
          <li key={counter.key} className="grid">
            <Link
              href={counter.href}
              className="grid content-start gap-0.5 rounded-[22px] border border-border bg-surface p-3.5 transition-[border-color] duration-fast ease-ios hover:border-border-strong"
            >
              <span
                className={cn(
                  'font-num text-[26px] leading-[1.1] font-light',
                  counter.isGold ? 'text-gold light:text-gold-lo' : 'text-foreground',
                )}
              >
                {counter.value == null ? '–' : number(counter.value)}
              </span>
              <span className="text-xs leading-[1.4] text-muted-foreground">{counter.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
