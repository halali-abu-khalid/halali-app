
const CACHE_NAME = 'halali-protected-offline-v5';

const APP_SHELL = [
  './halali-protected.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('halali-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin
  ) return;

  const protectedPath =
    new URL('./halali-protected.html', self.location.href).pathname;

  if (
    request.mode === 'navigate' &&
    url.pathname === protectedPath
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache =>
                  cache.put('./halali-protected.html', copy)
                )
            );
          }
          return response;
        })
        .catch(() =>
          caches.match('./halali-protected.html')
        )
    );
    return;
  }

  if (APP_SHELL.some(path =>
    new URL(path, self.location.href).pathname === url.pathname
  )) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request))
    );
  }
});
