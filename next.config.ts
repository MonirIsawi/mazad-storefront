import type { NextConfig } from 'next';

// NEXT_PUBLIC_* values are inlined at build time: a production build without them would silently
// ship the localhost development fallbacks (here, in shared/api/http-client.ts and
// shared/lib/asset.ts) to every visitor. Fail the build instead, like mazad-dashboard does.
if (process.env.NODE_ENV === 'production') {
  const missing = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_ASSET_BASE_URL'].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `${missing.join(' and ')} must be set for a production build (see .env.example)`,
    );
  }
}

const assetBaseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? 'http://localhost:3001/assets';

const assetUrl = (() => {
  try {
    return new URL(assetBaseUrl);
  } catch {
    return new URL('http://localhost:3001/assets');
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A stray ~/yarn.lock outside this workspace makes Turbopack guess the wrong project root —
  // pin it explicitly since frontend/ (this package.json) is always the real root.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      // mazad-api serves uploaded product photos from PUBLIC_ASSETS_BASE_URL (see
      // shared/lib/asset.ts for why the frontend has to resolve these itself).
      {
        protocol: assetUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: assetUrl.hostname,
        port: assetUrl.port,
        pathname: '/assets/**',
      },
      // mazad-api's Prisma seed data (prisma/seed.ts) fills demo auctions with Unsplash stock
      // photos instead of real uploads.
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
