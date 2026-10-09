import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

const API = 'https://mazad-api-production-e5a8.up.railway.app/api/v1';
const ASSETS = 'https://mazad-api-production-e5a8.up.railway.app/assets';

const directive = (csp: string, name: string) =>
  csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '';

describe('storefront security headers', () => {
  const csp = contentSecurityPolicy(API, ASSETS);

  it('lets the app reach the API over https and its Socket.IO over wss, nothing else', () => {
    expect(directive(csp, 'connect-src')).toBe(
      "connect-src 'self' https://mazad-api-production-e5a8.up.railway.app wss://mazad-api-production-e5a8.up.railway.app",
    );
  });

  it('allows product photos from the API asset host', () => {
    expect(directive(csp, 'img-src')).toContain('https://mazad-api-production-e5a8.up.railway.app');
  });

  it('never allows eval, plugins or framing', () => {
    expect(csp).not.toContain('unsafe-eval');
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
  });

  it('uses ws: for a local http API (development)', () => {
    expect(
      directive(contentSecurityPolicy('http://localhost:3001/api/v1'), 'connect-src'),
    ).toContain('ws://localhost:3001');
  });

  it('sends HSTS, nosniff, a referrer policy, X-Frame-Options and a permissions policy', () => {
    const keys = Object.fromEntries(securityHeaders(API, ASSETS).map((h) => [h.key, h.value]));
    expect(keys['Strict-Transport-Security']).toMatch(/max-age=\d{8}/);
    expect(keys['X-Content-Type-Options']).toBe('nosniff');
    expect(keys['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(keys['X-Frame-Options']).toBe('DENY');
    expect(keys['Permissions-Policy']).toContain('camera=()');
  });
});
