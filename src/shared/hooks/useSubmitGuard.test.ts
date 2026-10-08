import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSubmitGuard } from './useSubmitGuard';

describe('useSubmitGuard', () => {
  it('ignores a second start until the first releases', () => {
    const { result } = renderHook(() => useSubmitGuard());
    const starts: (() => void)[] = [];
    const start = vi.fn((release: () => void) => starts.push(release));

    result.current(start);
    result.current(start);
    expect(start).toHaveBeenCalledTimes(1);

    starts[0]?.();
    result.current(start);
    expect(start).toHaveBeenCalledTimes(2);
  });
});
