// Simple service worker for PWA - only cache static assets
const CACHE_NAME = 'wemoney-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/wemoney-logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for:
  // - API requests
  // - RSC requests (Next.js Server Components)
  // - Dynamic routes
  if (
    url.pathname.startsWith('/api/') ||
    url.searchParams.has('_rsc') ||
    event.request.method !== 'GET'
  ) {
    // Just fetch without caching
    return;
  }

  // Only cache static assets (images, icons, manifest)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
  // For everything else, just fetch directly
});
