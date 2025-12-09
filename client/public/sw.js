// client/public/sw.js
// Safe service worker: immediate activation + simple caching strategy

const STATIC_CACHE = "static-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  // add other assets you want to pre-cache if desired (optional)
];

// Install and pre-cache (optional)
self.addEventListener("install", (event) => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        /* ignore failures */
      });
    })
  );
});

// Activate and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Allow pages to message the SW to skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Helper: safe network-first for navigation, cache-first for other assets
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // SPA navigation or HTML requests -> network first then fallback to cached index.html
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Optionally update cache with fresh index
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(req, copy).catch(() => {});
          });
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For other requests: cache-first, fallback to network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cache the result for next time (best-effort)
          if (
            req.method === "GET" &&
            req.url.startsWith(self.location.origin)
          ) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(req, copy).catch(() => {});
            });
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
