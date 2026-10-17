import type { ReactNode } from 'react';

/** The page's one h1 in the display face, with the line that says what this step is for. */
export function AuthHeading({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <div className="grid gap-2">
      <h1 className="font-display text-display leading-[1.2] font-normal text-foreground">
        {title}
      </h1>
      {intro ? <p className="text-[15px] leading-[1.7] text-foreground-soft">{intro}</p> : null}
    </div>
  );
}
