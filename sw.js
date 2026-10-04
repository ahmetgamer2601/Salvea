// Önce ağ, olmazsa önbellek (geliştirirken eski sürümde takılmaz)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open("salvea-v1").then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
