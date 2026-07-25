const CACHE_NAME = "courseswyn-v1";
const urlsToCache = ["/", "/udemy-coupon-code", "/categories", "/topics"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(urlsToCache))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(clients.claim()); });
self.addEventListener("fetch", (e) => { e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request))); });
