// Shared between the app (download orchestrator) and the service worker
// (public/sw.js). Keep the string values in sync with public/sw.js — the SW is
// plain JS and cannot import from here.

// Cache holding everything the user explicitly downloaded for offline use
// (climbing-tiles JSON + wikimedia topo photos). Written from the window via
// caches.open(), read cache-first by the service worker.
export const OFFLINE_CACHE = 'openclimbing-offline-v1';

// Passively populated cache for immutable build assets and the app shell, so
// the app can boot with no network.
export const OFFLINE_RUNTIME_CACHE = 'openclimbing-runtime-v1';

// Climbing tiles exist only at zooms {0, 6, 9, 12} (see getClimbingTile.ts).
// We skip 0 (the whole-world tile is useless for a single area) and download
// 6 (overview), 9 (crags/areas) and 12 (individual routes).
export const OFFLINE_TILE_ZOOMS = [6, 9, 12];

// Exactly two Wikimedia widths are downloaded per photo — nothing in between,
// to keep offline size down:
//  - 500:  thumbnail/preview (map markers, image-strip, header thumbs, and the
//          topo viewer at small sizes)
//  - 1920: full quality (stays crisp when zooming into the topo viewer)
// When offline, getCommonsImageUrl() snaps every requested width up to the
// nearest of these, so the app only ever asks for one of the two we cached.
// Change this list and the app's offline requests follow automatically.
export const OFFLINE_PHOTO_WIDTHS = [500, 1920] as const;

// The app shell to warm so the PWA boots offline. We cache '/' (renders a null
// page, HTTP 200) — NOT '/start', which is a 302 redirect and can't be served
// back to a navigation ("response has redirections").
export const OFFLINE_APP_SHELL_URLS = ['/'];

// localStorage key for the index of downloaded areas (metadata + url lists).
export const OFFLINE_AREAS_STORAGE_KEY = 'openclimbing:offline:areas';
