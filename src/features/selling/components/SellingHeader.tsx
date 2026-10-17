'use client';

import { ScreenHeader, type ScreenHeaderProps } from '@shared/components/layout';
import { cn } from '@shared/lib';

const WIDTH = {
  narrow: 'lg:[&>header]:max-w-[900px]',
  wide: 'lg:[&>header]:max-w-[1080px]',
} as const;

/**
 * ScreenHeader lined up with a selling page's narrower column on desktop (the design's 820/1000px
 * `.wrap`). `contents` keeps the phone bar sticky against the page, not this wrapper.
 */
export function SellingHeader({
  width,
  ...props
}: ScreenHeaderProps & { width: keyof typeof WIDTH }) {
  return (
    <div className={cn('contents', WIDTH[width])}>
      <ScreenHeader {...props} />
    </div>
  );
}

/** The matching page column. */
export const SELLING_COLUMN = {
  narrow: 'max-w-[900px]!',
  wide: 'max-w-[1080px]!',
} as const;
