import { describe, it, expect } from 'vitest';
import { formatDuration } from './date';

describe('formatDuration', () => {
  it('formats seconds under a minute', () => {
    expect(formatDuration(45_000)).toBe('00:00:45');
  });

  it('formats hours and minutes under a day', () => {
    expect(formatDuration(2 * 3_600_000 + 5 * 60_000 + 9_000)).toBe('02:05:09');
  });

  it('prefixes days once a day has passed', () => {
    expect(formatDuration(3 * 86_400_000 + 3_661_000)).toBe('3d 01:01:01');
  });

  it.each([
    [1, 'يوم'],
    [2, 'يومان'],
    [3, '3 أيام'],
    [10, '10 أيام'],
    [11, '11 يومًا'],
    [99, '99 يومًا'],
    [100, '100 يوم'],
    [102, '102 يوم'],
    [103, '103 أيام'],
    [111, '111 يومًا'],
  ])('writes %i day(s) in Arabic with number agreement, never a Latin "d"', (days, word) => {
    const text = formatDuration(days * 86_400_000 + 3_661_000, 'ar');
    expect(text).toBe(`${word} 01:01:01`);
    expect(text).not.toMatch(/\dd\b/);
  });

  it('keeps the compact English unit', () => {
    expect(formatDuration(2 * 86_400_000, 'en')).toBe('2d 00:00:00');
  });

  it('clamps negative durations to zero', () => {
    expect(formatDuration(-5000)).toBe('00:00:00');
  });
});
