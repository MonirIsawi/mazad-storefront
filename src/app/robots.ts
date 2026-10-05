import type { MetadataRoute } from 'next';
import { siteUrl } from '@shared/seo';

/** Account, checkout-adjacent and auth pages are per-user; nothing there belongs in an index. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/account/', '/login', '/register'] },
    ...(base ? { host: base.origin } : {}),
  };
}
