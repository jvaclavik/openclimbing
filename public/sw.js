/* OpenClimbing service worker — offline support for downloaded climbing areas.
 *
 * Design goals:
 *  - Vercel-neutral: when online, our own dynamic endpoints go network-first,
 *    so behaviour (and Vercel function executions) is unchanged. Nothing is
 *    aggressively pre-cached server-side. This is why the previous SW was
 *    emptied (#801) — we don't reintroduce that cost.
 *  - Offline: serve only what the user explicitly downloaded (into
 *    OFFLINE_CACHE from the window) plus immutable build assets and the app
 *    shell that were cached passively while browsing online.
 *  - Respect MapTiler ToS: cross-origin basemap tiles/fonts are passthrough,
 *    never cached. Only wikimedia topo photos are cached cross-origin.
 *
 * Keep the cache names in sync with src/services/offline/consts.ts.
 */

const OFFLINE_CACHE = 'openclimbing-offline-v1';
const OFFLINE_RUNTIME_CACHE = 'openclimbing-runtime-v1';
const KNOWN_CACHES = [OFFLINE_CACHE, OFFLINE_RUNTIME_CACHE];

self.addEventListener('install', (event) => {
  // Install must be INSTANT. A long install (e.g. precaching ~30 chunks) can
  // get killed by iOS before it finishes — then the new SW never activates and
  // a stale (possibly broken) SW keeps serving forever, so deployed fixes
  // never reach the device. Shell precache happens in activate (after claim)
  // and is additionally warmed from the window on every online start.
  event.waitUntil(self.skipWaiting());
});

// Precache the app-shell HTML + the entry JS/CSS it references, so a cold
// OFFLINE launch always has something to boot from. Critical on iOS, where a
// missing shell shows the native "not connected" error instead of the app.
const precacheShell = async () => {
  try {
    const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
    const res = await fetch('/', { cache: 'reload' });
    if (!res.ok) return;
    await cache.put('/', res.clone());
    const html = await res.text();
    const re = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
    const chunks = [];
    let m;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(html))) chunks.push(m[1]);
    // Per-URL allSettled so one 404 can't abort the rest.
    await Promise.allSettled(chunks.map((u) => cache.add(u)));
  } catch (e) {
    // ignore — offline, or unexpected response
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older SW versions (name bump = clean slate).
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (n) => n.startsWith('openclimbing-') && !KNOWN_CACHES.includes(n),
          )
          .map((n) => caches.delete(n)),
      );
      // Claim FIRST so the SW controls pages immediately; then precache the
      // shell — if iOS kills the worker mid-precache, the window-side warm
      // (registerServiceWorker) fills the gap on the next online start.
      await self.clients.claim();
      await precacheShell();
    })(),
  );
});

// Match against each known cache explicitly, BY URL STRING. On iOS Safari:
//  - the global `caches.match()` is unreliable, and
//  - `cache.match(request)` with a Request object (especially a `navigate`
//    request) misses entries that `cache.match(urlString)` finds.
// So we always open each cache and match the plain URL — the same thing that
// works from the window (the diagnostic that reported "96/96" matches by URL).
// ignoreVary: our own responses carry `Vary: Accept-Encoding`.
const matchCaches = async (requestOrUrl) => {
  const url =
    typeof requestOrUrl === 'string' ? requestOrUrl : requestOrUrl.url;
  for (const name of KNOWN_CACHES) {
    // eslint-disable-next-line no-await-in-loop
    const cache = await caches.open(name);
    // eslint-disable-next-line no-await-in-loop
    const hit = await cache.match(url, { ignoreVary: true });
    if (hit) return hit;
  }
  return undefined;
};

// Cache-first: serve from any cache, otherwise fetch and store in runtime cache.
const cacheFirst = async (request) => {
  const cached = await matchCaches(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Offline and not cached — return a network error.
    return Response.error();
  }
};

// Width (in px) encoded in a wikimedia thumbnail URL: .../960px-Foo.jpg -> 960.
const thumbWidth = (urlStr) => {
  const m = urlStr.match(/\/(\d+)px-/);
  return m ? Number(m[1]) : 0;
};

// Wikimedia topo photos. Cache-first on the exact URL; on an offline miss for a
// thumbnail, serve ANY cached width of the same file. The app requests
// device-dependent widths (120 for header thumbs, a dynamic bucket like 960 for
// the topo viewer, ...) that we can't fully predict at download time, so we
// downscale/upscale whatever width we saved rather than failing.
const wikimediaHandler = async (request) => {
  const cached = await matchCaches(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const urlStr = request.url;
    const slash = urlStr.lastIndexOf('/');
    if (urlStr.includes('/thumb/') && slash > -1) {
      // Same thumbnail directory (.../thumb/h/hh/File/) = same source file.
      const prefix = urlStr.slice(0, slash + 1);
      const cache = await caches.open(OFFLINE_CACHE);
      const alts = (await cache.keys())
        .map((k) => k.url)
        .filter((k) => k.startsWith(prefix));
      if (alts.length) {
        // Prefer the smallest cached width that is still >= requested (crisp,
        // least memory); otherwise the largest we have.
        const want = thumbWidth(urlStr);
        alts.sort((a, b) => thumbWidth(a) - thumbWidth(b));
        const best =
          alts.find((u) => thumbWidth(u) >= want) || alts[alts.length - 1];
        const alt = await cache.match(best, { ignoreVary: true });
        if (alt) return alt;
      }
    }
    return Response.error();
  }
};

// Network-first: try the network (fresh data online), fall back to whatever we
// downloaded for offline use. We do NOT auto-cache here — downloads are written
// explicitly from the window, so online browsing stays Vercel-neutral.
const networkFirst = async (request) => {
  try {
    return await fetch(request);
  } catch (e) {
    const cached = await matchCaches(request);
    if (cached) return cached;
    return Response.error();
  }
};

// Network-first + cache-write: fresh online, and each successful response is
// stored so it stays available offline. Used for the id-tagging-schema
// translations (cdn.jsdelivr.net) — the feature panel loads them on every
// feature open, and their npm-fallback is a network chunk, so without a cached
// copy an offline feature load has no translations at all.
const networkFirstWithCache = async (request) => {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
      cache.put(request.url ?? request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await matchCaches(request);
    if (cached) return cached;
    return Response.error();
  }
};

// A Response flagged `redirected` cannot be returned to a navigation request
// (the browser throws "response served by service worker has redirections").
// Rebuild it as a plain, non-redirected response.
const stripRedirect = async (response) => {
  if (!response || !response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

// Page navigation: network-first, falling back to the cached app shell so the
// PWA still boots offline (client-side routing + cached data take over). We
// also cache successful navigations so the shell is available offline next
// time — network-first means no extra server load, we only store what we
// already fetched.
const navigationHandler = async (request) => {
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return await stripRedirect(response);
  } catch (e) {
    const cached =
      (await matchCaches(request)) ||
      (await matchCaches('/')) ||
      (await matchCaches('/start'));
    return (await stripRedirect(cached)) || Response.error();
  }
};

// In `next dev` the /_next/static chunks are NOT content-hashed and change on
// every recompile, so cache-firsting them serves stale JS and breaks hydration.
// Detect localhost and go network-first for build assets there. In production
// (hashed, immutable URLs) cache-first is correct and fast.
const isDevHost =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cross-origin: cache wikimedia topo photos, and serve the openclimbing.org
  // climbing API from cache when offline (CLIMBING_TILES_HOST points at the
  // prod host in local builds without NEXT_PUBLIC_CLIMBING_TILES_LOCAL).
  // Basemap tiles, fonts, sprites (MapTiler / OpenFreeMap) and everything else
  // are passthrough.
  if (url.origin !== self.location.origin) {
    if (url.hostname === 'upload.wikimedia.org') {
      event.respondWith(wikimediaHandler(request));
    } else if (
      url.hostname === 'openclimbing.org' &&
      url.pathname.startsWith('/api/climbing-tiles/')
    ) {
      event.respondWith(networkFirst(request));
    } else if (url.hostname === 'cdn.jsdelivr.net') {
      // id-tagging-schema translations — needed by every feature load; keep an
      // offline copy, refreshed whenever online.
      event.respondWith(networkFirstWithCache(request));
    }
    return;
  }

  // Build chunks: network-first in dev (fresh JS every recompile), cache-first
  // in prod (immutable content-hashed URLs).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(isDevHost ? networkFirst(request) : cacheFirst(request));
    return;
  }

  // Static logo/icon files (don't change during a dev session).
  if (
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/openclimbing') ||
    url.pathname.startsWith('/sprites')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Our own dynamic climbing data: fresh when online, offline copy otherwise.
  if (url.pathname.startsWith('/api/climbing-tiles/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Page navigations (HTML documents).
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else (other APIs, overpass, OSM, ...) — passthrough.
});
