// Einfacher App-Shell Service Worker mit Offline-Fallback und Queue für POSTs
const CACHE_NAME = 'arbeitsbericht-v1';
const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/js/idb.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Netzwerk-First für API, sonst Cache-First
  if (req.method === 'POST' || req.url.includes('/api/')) {
    event.respondWith(networkWithQueue(req));
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).catch(() => caches.match('/offline.html')))
  );
});

async function networkWithQueue(request) {
  try {
    const res = await fetch(request.clone());
    return res;
  } catch (err) {
    // Request offline vormerken (Background Sync ersatzweise)
    const body = await request.clone().json().catch(() => ({}));
    const queue = await getQueueDB();
    const tx = queue.transaction('outbox', 'readwrite');
    await tx.store.add({ url: request.url, body, ts: Date.now() });
    await tx.done;
    return new Response(JSON.stringify({ queued: true, offline: true }), { status: 202, headers: { 'Content-Type': 'application/json' }});
  }
}

// Primitive IndexedDB in SW (separat von /js/idb.js im Client)
importScripts('https://unpkg.com/idb-keyval@6/dist/idb-keyval-iife.min.js');
const { createStore, get, set, del } = idbKeyval;
const queueStore = createStore('arbeitsbericht-sw', 'kv');

async function getQueueDB() {
  // Leichte DB über idb-keyval emulieren
  // Wir speichern die Outbox als Array unter Key 'outbox'
  return {
    transaction: () => ({
      store: {
        add: async (entry) => {
          const arr = (await get('outbox', queueStore)) || [];
          arr.push(entry);
          await set('outbox', arr, queueStore);
        },
        getAll: async () => (await get('outbox', queueStore)) || [],
        clear: async () => del('outbox', queueStore)
      }
    }),
    done: Promise.resolve()
  };
}

// Versuch der Nach-Synchronisation bei Wieder-Online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(flushOutbox());
  }
});

self.addEventListener('online', flushOutbox);
self.addEventListener('message', (e) => { if (e.data === 'flush') flushOutbox(); });

async function flushOutbox() {
  const kv = await get('outbox', queueStore) || [];
  if (!kv.length) return;
  const rest = [];
  for (const item of kv) {
    try {
      const res = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body)
      });
      if (!res.ok) throw new Error('sync failed');
    } catch (e) {
      rest.push(item); // bleibt in Outbox
    }
  }
  if (rest.length) await set('outbox', rest, queueStore); else await del('outbox', queueStore);
}
