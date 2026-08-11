/* eslint-disable no-restricted-globals */
/* Push-only service worker — no page caching (native-style notifications) */

const DEFAULTS = {
  title: 'MyHomeBazar',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-72.png',
  tag: 'myhomebazar',
};

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: DEFAULTS.title, body: '', url: '/', tag: '' };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload.body = event.data?.text?.() || '';
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || DEFAULTS.icon,
    badge: payload.badge || DEFAULTS.badge,
    tag: payload.tag || DEFAULTS.tag,
    data: { url: payload.url || '/', ...(payload.data || {}) },
    renotify: true,
    vibrate: [180, 90, 180],
    timestamp: Date.now(),
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || DEFAULTS.title, options),
  );
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
