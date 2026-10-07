import { describe, expect, it } from 'vitest';
import { closedMessageKey } from './closed-message';

describe('closedMessageKey', () => {
  it('says an upcoming auction has not started, instead of "closed"', () => {
    expect(closedMessageKey('SCHEDULED')).toBe('panel.notStarted');
  });

  it.each(['ENDED', 'SOLD', 'UNSOLD', 'CANCELLED'])('says a %s auction is closed', (status) => {
    expect(closedMessageKey(status)).toBe('panel.notLive');
  });
});
