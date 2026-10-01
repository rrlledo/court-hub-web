const CACHE = 'court-hub-shell-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icons/court-hub.svg']
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && (event.request.mode === 'navigate' || event.request.destination === 'script' || event.request.destination === 'style')) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
    return response
  }).catch(() => caches.match('/'))))
})
