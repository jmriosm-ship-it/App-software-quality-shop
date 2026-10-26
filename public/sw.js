const CACHE = 'qs-inventario-v2'

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './logo.png'])))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

// Primero intenta la red (para recibir actualizaciones); si no hay internet usa la caché.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // solo guarda respuestas buenas (nunca un error)
        if (res.ok) {
          const copia = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copia))
        }
        return res
      })
      .catch(() => caches.match(e.request)),
  )
})