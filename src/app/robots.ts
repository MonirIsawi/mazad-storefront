import type { MetadataRoute } from 'next';
import { isNoIndex, siteUrl } from '@shared/seo';

/** Account, checkout-adjacent and auth pages are per-user; nothing there belongs in an index. */
export default function robots(): MetadataRoute.Robots {
  // A staging/beta deployment stays out of every index.
  if (isNoIndex()) return { rules: { userAgent: '*', disallow: '/' } };
  const base = siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account/', '/login', '/register', '/reset-password'],
    },
    ...(base ? { host: base.origin } : {}),
  };
}
