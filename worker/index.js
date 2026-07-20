/* Custom worker additions for @ducanh2912/next-pwa (merged into sw.js at build).
 * Handles Web Push so Critical/High alerts can show when the tab/PWA is backgrounded.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || data.message || 'SenioSentry alert';
  const body =
    data.body || data.message || data.title || 'Open SenioSentry for details.';
  const url = data.url || data.path || '/dashboard/alert';
  const options = {
    body,
    icon: '/assets/images/logo.png',
    badge: '/assets/images/logo.png',
    data: { url },
    tag: data.tag || `senio-${data.alert_id || Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(data.requireInteraction),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(target);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      if (clients.openWindow) {
        await clients.openWindow(target);
      }
    })(),
  );
});
