/* eslint-disable no-restricted-globals */
self.addEventListener('push', (event) => {
  let payload = { title: 'MyHomeBazar', body: '', url: '/', tag: '' };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload.body = event.data?.text?.() || '';
  }

  const options = {
    body: payload.body || '',
    icon: '/favicon.ico',
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
