const CACHE_NAME = 'botequista-v26';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.json?v=4',
  '/logo.svg',
  '/logo.svg?v=4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// Estratégia de Cache: Network First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não cachear chamadas de API ou Firebase
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com')) {
    return; 
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match('/index.html');
          }
          
          return new Response('Offline', { status: 404 });
        });
      })
  );
});