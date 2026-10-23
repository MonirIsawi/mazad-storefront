'use client';

import { Fragment } from 'react';
import { Price } from '@shared/components/ui';
import type { HelpBlock } from '../content';

type ExampleBlock = Extract<HelpBlock, { type: 'example' }>;

/** A worked example (design `.ladder`): labels and amounts in two columns on a raised panel. */
export function HelpExample({ block, label }: { block: ExampleBlock; label: string }) {
  return (
    <figure aria-label={label} className="grid gap-2.5 rounded-[18px] bg-surface-raised p-3.5">
      <figcaption className="text-xs font-medium text-muted-foreground">{block.caption}</figcaption>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 text-[13.5px]">
        {block.rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-foreground-soft">{row.label}</dt>
            <dd className="text-end font-semibold">
              <Price value={row.amount} size="sm" tone={row.isResult ? 'gold' : 'plain'} />
            </dd>
          </Fragment>
        ))}
      </dl>
    </figure>
  );
}
