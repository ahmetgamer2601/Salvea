// Önce ağ, olmazsa önbellek (geliştirirken eski sürümde takılmaz) + telefon bildirimleri
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open("salvea-v1").then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
});

// Sunucudan bildirim geldi. iPhone ve Chrome her push için görünür bildirim ister; bu yüzden hep gösteriyoruz.
// Uygulama açık ve ön plandaysa sessiz gösterilir.
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { metin: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => {
    const acik = (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).some(c => c.visibilityState === "visible");
    await self.registration.showNotification(d.baslik || "Salvea", { body: d.metin || "", tag: d.tag || undefined, renotify: !!d.tag, silent: acik, icon: "icon-192.png", badge: "icon-192.png", lang: "tr", data: { url: d.url || "" } });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.url) || "", hedef = new URL("app.html" + (hash.startsWith("#") ? hash : ""), self.registration.scope).href;
  e.waitUntil((async () => {
    const tum = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of tum) if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ git: hash }); return; }
    await self.clients.openWindow(hedef);
  })());
});
