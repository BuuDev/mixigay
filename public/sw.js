/* Góc Bộ Tộc service worker: an offline fallback page, nothing more.
 *
 * - Precache: /offline, its stylesheets, and the brand icons. Nothing else is ever cached.
 * - Navigations: network first; when the network fails, show /offline.
 * - Never touched: non-GET (server actions are POST), cross-origin, /api/, /auth/,
 *   /admin, /tai-khoan, /moi (one-time invite tokens). They go straight to the network.
 * - Bump VERSION to roll out a new precache; activate deletes every older cache.
 */
const VERSION = "v2";
const CACHE = `goc-bo-toc-offline-${VERSION}`;
const OFFLINE_URL = "/offline";
const ICONS = ["/icon-192", "/icon-512", "/icon.svg", "/brand/logomark.svg", "/art/cu-dem/20-dang-xuat-di-ngu.webp"];
const BYPASS = /^\/(api|auth|admin|tai-khoan|moi)(\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const res = await fetch(OFFLINE_URL, { cache: "reload" });
      if (!res.ok) throw new Error(`offline page: ${res.status}`);
      // The offline page needs its stylesheets to look like the site; its scripts are not needed.
      const html = await res.clone().text();
      const css = [...html.matchAll(/href="(\/_next\/static\/[^"?]+\.css)(?:\?[^"]*)?"/g)].map((m) => m[1]);
      await cache.put(OFFLINE_URL, res);
      // Icons and styles are nice to have: one missing file must not block the offline page.
      await Promise.allSettled([...new Set([...ICONS, ...css])].map((url) => cache.add(new Request(url, { cache: "reload" }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("goc-bo-toc-offline-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || BYPASS.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(OFFLINE_URL)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Precached files only (icons, the offline page's CSS): network first, cache when offline.
  // Everything else (pages' RSC payloads, scripts, images) is left to the browser.
  if (!ICONS.includes(url.pathname) && !/^\/_next\/static\/.+\.css$/.test(url.pathname)) return;
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request, { cacheName: CACHE, ignoreSearch: true });
        return cached ?? Response.error();
      }
    })(),
  );
});
