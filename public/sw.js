/* Self-destructing service worker (v3 — safe).
 *
 * No fetch handler: intercepting navigation requests with a RequestInit
 * throws and blanks the page. This worker only cleans up: on activate it
 * wipes all caches, unregisters itself, and reloads open tabs.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch {}
      });
    })()
  );
});
