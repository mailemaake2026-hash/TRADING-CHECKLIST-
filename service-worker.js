const CACHE_NAME = 'mailes-checklist-pwa-v1';

// Relative URLs keep this service worker compatible with GitHub Pages project sites.
const APP_ROOT = new URL('./', self.location).href;
const CORE_ASSETS = [
  APP_ROOT,
  new URL('index.html', APP_ROOT).href,
  new URL('manifest.json', APP_ROOT).href,
  new URL('icon-192.png', APP_ROOT).href,
  new URL('icon-512.png', APP_ROOT).href
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests. POST/other requests continue normally.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache successful same-origin GETs so future visits can work offline.
          const url = new URL(event.request.url);
          if (url.origin === self.location.origin && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Navigation fallback to the cached app shell.
          if (event.request.mode === 'navigate') {
            return caches.match(APP_ROOT);
          }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
