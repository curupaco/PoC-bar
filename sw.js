
const CACHE_NAME = 'botequista-v19';
const ASSETS = [
  'index.html',
  './index.html',
  'manifest.json',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://img.icons8.com/fluency/512/beer.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
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

// Estratégia principal para PWAs: Network-First com Fallback SPA
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar rotas de API (Vercel) e Banco de Dados (Firebase)
  // Isso força o navegador a buscar dados frescos sempre, sem usar o cache do SW
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com')) {
    return; 
  }

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response.ok && response.status === 404) {
             return caches.match('index.html') || caches.match('./index.html') || caches.match('/');
          }
          return response;
        })
        .catch(() => {
          return caches.match('index.html') || caches.match('./index.html') || caches.match('/');
        })
    );
    return;
  }

  // Para outros assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return new Response('', { status: 404 });
      });
    })
  );
});
