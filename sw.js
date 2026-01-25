
const CACHE_NAME = 'botequista-v20';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://img.icons8.com/fluency/512/beer.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta adicionar os assets básicos
      return cache.addAll(ASSETS).catch(err => console.log('Erro no cache inicial:', err));
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

// Estratégia: Network First, falling back to Cache for Navigation
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar APIs e Banco de Dados para não cachear dados obsoletos
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com')) {
    return; 
  }

  // Se for navegação (abrir o app), tenta rede, se falhar ou 404, manda o index.html do cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Para outros assets (css, imagens, etc)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => new Response('', { status: 404 }));
    })
  );
});
