/**
 * HTTP security headers for every storefront response (wired in next.config.ts).
 *
 * The CSP is as tight as the current app allows:
 * - connect-src: this origin plus mazad-api over https and wss (REST + Socket.IO).
 * - img-src: this origin (next/image), the API's asset host, and Unsplash (demo seed photos).
 * - script-src keeps 'unsafe-inline': the App Router streams its payload through inline
 *   <script> tags, and layout.tsx has an inline theme/locale script plus JSON-LD on auction pages.
 *   Removing it needs a per-request nonce (middleware), which would make every page dynamic.
 *   There is no 'unsafe-eval': production Next.js doesn't need it.
 * - frame-ancestors 'none' (and X-Frame-Options DENY for old browsers): no framing at all.
 */

function origin(url: string | undefined): URL | null {
  if (!url) return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function contentSecurityPolicy(apiUrl?: string, assetBaseUrl?: string): string {
  const api = origin(apiUrl);
  const assets = origin(assetBaseUrl);
  const socket = api ? `${api.protocol === 'https:' ? 'wss:' : 'ws:'}//${api.host}` : null;
  const list = (...items: (string | null | undefined)[]) =>
    [...new Set(items.filter((item): item is string => Boolean(item)))].join(' ');

  return [
    "default-src 'self'",
    `connect-src ${list("'self'", api?.origin, socket)}`,
    `img-src ${list("'self'", 'data:', 'blob:', assets?.origin, 'https://images.unsplash.com')}`,
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function securityHeaders(apiUrl?: string, assetBaseUrl?: string) {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(apiUrl, assetBaseUrl) },
    // Two years, subdomains too. Not "preload": that is a commitment for the final domain.
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    // Nothing here uses these. The share sheet and file pickers need no permission.
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  ];
}
