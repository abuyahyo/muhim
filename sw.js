// Service Worker — `Исломий Тақвим` PWA.
//
// Стратегия:
//   - HTML: network-first (2с timeout) → fallback кеш. Янги deploy
//     дарҳол кўриниши учун: index.html тармоқдан, у JS/CSS манзилларини
//     ўз ичида олиб келади.
//   - JS/CSS/SVG/JSON: stale-while-revalidate — кешдан тез, параллел
//     янгисини юклаб қойилади.
//
// `VERSION`ни ҳар жиддий ўзгаришда инкремент қилинг — буни ўзгартирилса
// SW қайта ўрнатилади ва эски кеш тозаланади. Активация янги версия
// тайёрланганда `SKIP_WAITING` хабари orqали тезлаштирилади (banner).
const VERSION = 'v247';
const STATIC_CACHE = `static-${VERSION}`;
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './nav.css',
  './data.js',
  './hijri.js',
  './app.js',
  './vaqtlar/',
  './vaqtlar/index.html',
  './vaqtlar/app.js',
  './vaqtlar/data.js',
  './vaqtlar/styles.css',
  './vaqtlar/prayer.js',
  './joylar/',
  './joylar/index.html',
  './joylar/app.js',
  './joylar/data.js',
  './joylar/styles.css',
  './manifest.json',
  './icon.svg',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  // Ҳар бир ресурсни алоҳида кешлаймиз — биттаси 404 берса ҳам бутун
  // ўрнатиш бузилмайди (addAll atomic, шунинг учун ишлатилмайди).
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML — network-first; шу orqали янги deploy биринчи зиёратда олинади.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  // Қолганлар — stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req) || await cache.match('./');
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  const fetched = fetch(req).then((res) => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetched;
}
