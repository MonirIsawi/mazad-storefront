'use client';

import { useMemo } from 'react';
import { useApiFeature } from '@shared/hooks';
import { supportChannels, type SupportChannel } from '../lib/channels';

export interface SupportContact {
  /** The API has support reports (false while the probe is in flight or when it answers 404). */
  canReport: boolean;
  /** Chat channels configured for this deployment (none today). */
  channels: SupportChannel[];
  /** There is some real way to reach us: the form, a channel, or both. */
  hasContact: boolean;
}

/** What ways to reach us this deployment really has; nothing is shown until the probe answers. */
export function useSupportContact(): SupportContact {
  const canReport = useApiFeature('supportReports') === true;
  const channels = useMemo(() => supportChannels(), []);
  return { canReport, channels, hasContact: canReport || channels.length > 0 };
}
