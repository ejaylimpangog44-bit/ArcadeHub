const CACHE_NAME = 'arcadehub-cache-v29';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './hub.js',
  './basketball.js',
  './card-deck.js',
  './speed-solitaire.js',
  './coin-scatter.js',
  './blackjack.js',
  './high-low.js',
  './chess.js',
  './dama.js',
  './tic-tac-toe.js',
  './number-guess.js',
  './wordscape.js',
  './fruitmaster.js',
  './whack-a-mole.js',
  './cyber-snake.js',
  './tower-stack.js',
  './car-racing.js',
  './brick-breaker.js',
  './stick-run.js',
  './tiny-cafe.js',
  './hero.js',
  './power.js',
  './bgm.mp3',
  './manifest.json',
  './image-512.jpg',
  './1000034484.gif',
  './flickpoint.html',
  './flickpoint.css',
  './flickpoint.js',
  './mythic.html',
  './mythic.css',
  './mythic.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          const response = await fetch(asset, { cache: 'no-cache' });
          if (response.ok) {
            await cache.put(asset, response);
          }
        } catch (_) {
          // Skip unavailable asset so install still succeeds
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
