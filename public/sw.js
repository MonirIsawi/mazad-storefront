/*
 * Bidoom (mazad-storefront) service worker.
 *
 * Deliberately minimal. This is a live auction marketplace: a cached page showing a stale price,
 * a bid count that has moved, or a closed auction still counting down is worse than no page at
 * all, so nothing from the API is ever cached. Two things are:
 *
 *   1. /_next/static/** — content-hashed at build time, so it can never go stale.
 *   2. /offline.html — the fallback shown when a navigation cannot reach the network.
 *
 * Everything else, above all /api and image assets whose URLs are stable, goes straight to the
 * network every time. The fetch handler also exists because Chrome will not offer to install a
 * PWA without one.
 */
// v2: the Bidoom offline page. A new cache name makes installed workers fetch it again (the old
// cache is dropped on activate); the name is internal and signs nobody out.
const CACHE = 'mazad-static-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Immutable build output: serve from cache, fall back to the network and keep a copy.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              void caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Navigations: always the network, so prices and countdowns are whatever the server says.
  // Offline, an honest notice rather than a plausible-looking stale screen.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL).then((hit) => hit ?? Response.error())),
    );
  }
});
