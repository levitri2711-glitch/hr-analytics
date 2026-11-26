// Service worker: lưu giao diện để mở khi mất mạng; không lưu dữ liệu gọi máy chủ.
const VERSION = 'hts-shell-v6';
const SHELL = ['./', 'index.html', 'app.css', 'ta.css', 'ui.css', 'config.js', 'icon.svg', 'manifest.webmanifest', 'js/hr.js', 'js/ta-data.js', 'js/ta-views.js', 'js/xlsx.js', 'js/ta-actions.js', 'js/legal.js', 'js/bridge.js', 'js/app.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api')) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))));
});
