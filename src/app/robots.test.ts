import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from './robots';

describe('robots.txt', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps account and auth pages out of the index by default', () => {
    vi.stubEnv('NEXT_PUBLIC_NOINDEX', '');
    expect(robots().rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/login', '/register', '/reset-password'],
    });
  });

  it('disallows everything on a staging deployment (NEXT_PUBLIC_NOINDEX=true)', () => {
    vi.stubEnv('NEXT_PUBLIC_NOINDEX', 'true');
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  });
});
