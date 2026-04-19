/**
 * Oracle Plus — Service Worker
 * Stratégie :
 *  - HTML / JS / CSS  → Network First  (toujours la version la plus récente)
 *  - Images / Fonts   → Cache First    (ressources statiques stables)
 *  - API              → Network Only   (requêtes externes ignorées)
 *
 * Mise à jour automatique : dès qu'un nouveau SW s'installe, il prend
 * immédiatement le contrôle et envoie un message RELOAD à toutes les pages
 * ouvertes — elles se rechargent automatiquement.
 */

const CACHE_VERSION = 'oracle-plus-v3';
const CACHE_STATIC  = `${CACHE_VERSION}-static`;

// Ressources mises en cache à l'installation (shell minimal)
const PRECACHE_URLS = ['/manifest.json'];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  // Prendre le contrôle immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_STATIC)
          .map((n) => caches.delete(n)),
      ),
    ).then(() => {
      // Prendre le contrôle de toutes les pages ouvertes
      return self.clients.claim();
    }).then(() => {
      // Signaler à toutes les pages qu'une nouvelle version est active → reload
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      });
    }),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET et les origines externes (API, etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  const isNavigation = request.mode === 'navigate';
  const isAppAsset   = /\.(js|css|html)(\?.*)?$/.test(url.pathname);
  const isStaticFile = /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)(\?.*)?$/.test(url.pathname);

  if (isStaticFile) {
    // Cache First pour les images/fonts (ne changent pas entre déploiements)
    event.respondWith(cacheFirst(request));
  } else if (isNavigation || isAppAsset) {
    // Network First pour HTML et bundles JS/CSS → toujours la dernière version
    event.respondWith(networkFirst(request));
  } else {
    // Network First par défaut
    event.respondWith(networkFirst(request));
  }
});

// ─── Stratégies ───────────────────────────────────────────────────────────────

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Hors ligne : servir depuis le cache si disponible
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback sur la page principale pour les navigations
    if (request.mode === 'navigate') {
      return caches.match('/') ?? new Response('Hors ligne', { status: 503 });
    }
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = {}; }

  const title = data.title ?? '✨ Oracle Plus';
  const body  = data.body  ?? 'Un nouveau message spirituel vous attend.';
  const url   = data.url   ?? '/';

  // tag = identifiant unique par type de notification
  // → si l'utilisateur reçoit 2 pushes "matin" en retard, un seul s'affiche
  const tag = data.tag ?? 'oracle-plus-default';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/icon-192.png',
      badge:   '/icon-maskable-192.png',
      vibrate: [200, 100, 200],
      tag,                    // déduplique : remplace la notif précédente du même tag
      renotify: false,        // ne re-sonne pas si la notif du même tag est déjà là
      requireInteraction: false,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Si une fenêtre PWA est déjà ouverte, la focus
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      return clients.openWindow(url);
    }),
  );
});
