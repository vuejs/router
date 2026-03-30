// force clearing previous service worker
self.addEventListener('install', function (_e) {
  self.skipWaiting()
})

self.addEventListener('activate', function (_e) {
  self.registration
    .unregister()
    .then(function () {
      return self.clients.matchAll()
    })
    .then(function (clients) {
      clients.forEach(client => client.navigate(client.url))
    })
})
