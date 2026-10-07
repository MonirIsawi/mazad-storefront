/**
 * Why the bid form isn't shown: an upcoming (SCHEDULED) auction hasn't opened yet, every other
 * non-live status (ended, sold, unsold, cancelled) is closed for good.
 */
export function closedMessageKey(status: string): 'panel.notStarted' | 'panel.notLive' {
  return status === 'SCHEDULED' ? 'panel.notStarted' : 'panel.notLive';
}
