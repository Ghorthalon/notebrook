const CACHE_NAME = 'notebrook-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/intro.wav',
  '/login.wav',
  '/uploadfail.wav',
  '/water1.wav',
  '/water2.wav',
  '/water3.wav',
  '/water4.wav',
  '/water5.wav',
  '/water6.wav',
  '/water7.wav',
  '/water8.wav',
  '/water9.wav',
  '/water10.wav',
  '/sent1.wav',
  '/sent2.wav',
  '/sent3.wav',
  '/sent4.wav',
  '/sent5.wav',
  '/sent6.wav',
  '/vite.svg',
  '/src/main.ts'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found, otherwise fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event: any) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
