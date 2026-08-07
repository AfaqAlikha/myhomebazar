/* eslint-disable no-restricted-globals */
/* MyHomeBazar PWA service worker — caching + push notifications */

const CACHE_VERSION = 'mhb-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('mhb-') && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return (
    url.hostname.includes('api.myhomebazar.com') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('amazonaws.com')
  );
}

function isStaticAsset(url) {
  return /\.(?:js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|webmanifest)$/i.test(
    url.pathname,
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API / auth / checkout traffic
  if (isApiRequest(url)) return;

  // Navigation: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/') || Response.error();
        }),
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (isStaticAsset(url) && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: 'MyHomeBazar', body: '', url: '/', tag: '' };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload.body = event.data?.text?.() || '';
  }

  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.tag || 'myhomebazar',
    data: { url: payload.url || '/', ...(payload.data || {}) },
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'MyHomeBazar', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
