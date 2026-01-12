
const CACHE_NAME = 'botequista-v1';

// Instalação do SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação do SW
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Interceptação de fetch (pass-through básico)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
