
const CACHE_NAME = 'botequista-v12';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://img.icons8.com/fluency/512/beer.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta cachear os assets, ignorando falhas individuais
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

// Estratégia principal para PWAs: Network-First com Fallback SPA robusto
self.addEventListener('fetch', (event) => {
  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se for 404 na rede, o servidor não sabe lidar com a rota do SPA.
          // Entregamos o index.html do cache para o React assumir a rota.
          if (!response.ok && response.status === 404) {
             return caches.match('./index.html') || caches.match('index.html');
          }
          return response;
        })
        .catch(() => {
          // Se estiver offline ou a rede falhar, entrega o index.html
          return caches.match('./index.html') || caches.match('index.html');
        })
    );
    return;
  }

  // Para outros assets (imagens, scripts)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback silencioso para assets não essenciais
        return new Response('', { status: 404 });
      });
    })
  );
});
