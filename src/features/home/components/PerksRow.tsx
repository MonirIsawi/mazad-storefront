'use client';

import { GoldTile, Icon, type IconName } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useHomeTranslation } from '../hooks/useHomeTranslation';

/**
 * The product's promises, each a real rule of the marketplace (design PERKS). Not "verified
 * sellers": verification is per seller (an admin flag), so it is a badge on a verified seller,
 * never a promise about all of them.
 */
const PERKS: { icon: IconName; key: string }[] = [
  { icon: 'cash', key: 'cod' },
  { icon: 'undo', key: 'returns' },
  { icon: 'hourglass', key: 'antiSniping' },
];

/** Phones: the gold tiles in a row (design `.perks`). */
export function PerksRow({ className }: { className?: string }) {
  const { t } = useHomeTranslation();
  return (
    <ul className={cn('grid grid-cols-3 gap-2', className)}>
      {PERKS.map((perk) => (
        <li key={perk.key} className="grid justify-items-center gap-2 text-center">
          <GoldTile icon={perk.icon} />
          <span className="text-[11.5px] leading-[1.35] font-medium text-foreground-soft">
            {t(`perks.${perk.key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Desktop: the same promises as quiet pills under the hero copy (design `.trust`). */
export function TrustPills() {
  const { t } = useHomeTranslation();
  return (
    <ul className="flex flex-wrap gap-2.5 border-t border-border pt-3.5">
      {PERKS.map((perk) => (
        <li
          key={perk.key}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[13px] text-foreground-soft"
        >
          <Icon name={perk.icon} tone="gold" size={18} weight={4.6} />
          {t(`perks.${perk.key}`)}
        </li>
      ))}
    </ul>
  );
}
