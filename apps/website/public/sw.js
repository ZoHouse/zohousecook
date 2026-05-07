/* Zo World — service worker
 *
 * Strategy:
 *   • HTML pages: network-first, fall back to cached shell (offline-friendly).
 *     Avoids stale page issues from a long-lived install.
 *   • _next/static + icons + manifest: cache-first. These are content-hashed
 *     by Next.js so a new build invalidates them automatically.
 *   • Cross-origin: never intercept. Razorpay, Supabase, GTM, fonts, CDN
 *     should hit the network unmodified. Same-origin only.
 *
 * Versioning: bump CACHE_VERSION when the SW logic itself changes (not for
 *   content updates — those are handled by the strategies above).
 */

const CACHE_VERSION = "v1-2026-04-30";
const HTML_CACHE = `zo-html-${CACHE_VERSION}`;
const STATIC_CACHE = `zo-static-${CACHE_VERSION}`;

const OFFLINE_FALLBACK = "/passport";
const STATIC_PREFIXES = ["/_next/static/", "/icons/"];
const STATIC_FILES = new Set(["/manifest.webmanifest", "/favicon.ico"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(HTML_CACHE);
      try {
        await cache.add(OFFLINE_FALLBACK);
      } catch {
        // Pre-cache is best-effort; the SW still installs without it.
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("zo-") && !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    STATIC_PREFIXES.some((p) => url.pathname.startsWith(p)) ||
    STATIC_FILES.has(url.pathname);

  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Treat HTML/document navigations as network-first with offline fallback.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, HTML_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match(OFFLINE_FALLBACK);
    if (fallback) return fallback;
    throw err;
  }
}

// Allow the page to trigger an update flow after a deploy.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
