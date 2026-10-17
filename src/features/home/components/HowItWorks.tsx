'use client';

import { GoldTile, type IconName } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useHomeTranslation } from '../hooks/useHomeTranslation';

const STEPS: { icon: IconName; key: string }[] = [
  { icon: 'paddle', key: 'bid' },
  { icon: 'trophy', key: 'win' },
  { icon: 'package', key: 'order' },
  { icon: 'truck', key: 'receive' },
];

/** Desktop: the four steps from bid to delivery (design `.howto`). */
export function HowItWorks() {
  const { t } = useHomeTranslation();
  const { number } = useMoney();
  return (
    <section aria-label={t('sections.howTo')} className="hidden lg:block">
      <ol className="grid grid-cols-4 gap-4">
        {STEPS.map((step, index) => (
          <li
            key={step.key}
            className="relative grid gap-3 rounded-xl border border-border-strong bg-[linear-gradient(180deg,var(--color-surface),transparent)] p-[22px]"
          >
            <span
              aria-hidden
              className="absolute end-5 top-[18px] font-num text-[30px] font-light text-gold-line"
            >
              {number(index + 1)}
            </span>
            <GoldTile icon={step.icon} size="lg" />
            <b className="text-[15px] font-medium text-foreground">{t(`howTo.${step.key}`)}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
