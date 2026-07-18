/* Self-destructing service worker.
 *
 * An older deploy registered a PWA service worker that precached build
 * chunks. New builds use turbopack (next-pwa's webpack plugin doesn't run),
 * so the precache went permanently stale and broke the app for returning
 * visitors. This worker replaces the old one, wipes every cache, and
 * unregisters itself; pages then load directly from the network.
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
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
