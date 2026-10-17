'use client';

import { BrandLockup, BrandMark } from '@shared/components/brand';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';

/**
 * The desktop half beside the form: the engraved mark in its warm glow on the dark ground (dark in
 * both themes, like the design's photo panel), the lockup and the one-line promise at the foot.
 */
export function AuthBrandPanel() {
  const { t } = useAuthTranslation();
  return (
    <div
      data-surface="dark"
      className="relative hidden min-h-dvh overflow-hidden bg-background text-foreground lg:block"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 bottom-[22%] grid place-items-center">
        <span className="col-start-1 row-start-1 size-[640px] rounded-full bg-glow" />
        <span className="col-start-1 row-start-1 drop-shadow-[0_30px_60px_rgb(0_0_0/55%)]">
          <BrandMark size={176} />
        </span>
      </div>
      <div className="absolute inset-x-10 bottom-11 grid gap-[18px]">
        <BrandLockup />
        <p className="max-w-[22ch] text-h2 leading-[1.5] font-light text-foreground">
          {t('shell.tagline')}
        </p>
      </div>
    </div>
  );
}
