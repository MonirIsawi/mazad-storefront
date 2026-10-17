import type { ReactNode } from 'react';
import { StateBanner } from '@shared/components/ui';

/** An error that belongs to no one field (rate limits, a suspended account, a server error). */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <StateBanner tone="bad" icon="warning" role="alert" className="text-sm">
      {children}
    </StateBanner>
  );
}
