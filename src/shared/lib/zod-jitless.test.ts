import { afterEach, describe, expect, it, vi } from 'vitest';
import { config, z } from 'zod';
import './zod-jitless';

describe('zod without eval', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is configured jitless, so it never probes Function (blocked by the CSP)', () => {
    expect(config().jitless).toBe(true);
    const probe = vi.spyOn(globalThis, 'Function');
    expect(z.object({ a: z.string(), b: z.number() }).parse({ a: 'x', b: 1 })).toEqual({
      a: 'x',
      b: 1,
    });
    expect(probe).not.toHaveBeenCalled();
  });
});
