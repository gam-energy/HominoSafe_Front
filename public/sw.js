/* Self-destructing service worker (v2 — aggressive).
 *
 * The previous version only ran on activate, which can be skipped if the
 * browser never re-checks sw.js. This version also intercepts every fetch
 * and bypasses cache entirely (network-first), so even while the old worker
 * is still active, requests go to the network instead of stale precache.
 * On activate it wipes all caches, unregisters itself, and force-reloads
 * all open tabs.
 */

// Network-first: never serve from cache, always go to network.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store', credentials: 'include' }).catch(
      () => new Response('', { status: 502 })
    )
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Wipe every cache storage entry.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      // Unregister this worker.
      await self.registration.unregister();

      // Force-reload all open tabs so they pick up the new build.
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch {}
      });
    })()
  );
});
