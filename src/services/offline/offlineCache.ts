import { OFFLINE_CACHE, OFFLINE_RUNTIME_CACHE } from './consts';
import { getFeatureGetUrl } from './collectAreaUrls';

export const isOfflineCacheSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'caches' in window &&
  'serviceWorker' in navigator;

export type CacheProgress = {
  done: number;
  total: number;
  failed: number;
};

export type CacheResult = {
  cachedUrls: string[]; // URLs that ended up in the cache (already there or newly fetched)
  failed: string[];
  bytes: number; // sum of Content-Length across newly fetched responses
};

const bytesOf = (response: Response): number => {
  const len = response.headers.get('content-length');
  return len ? Number(len) : 0;
};

/**
 * Downloads each URL and stores the response in OFFLINE_CACHE. Runs in the
 * window (not the SW) so we get progress + control. Already-cached URLs are
 * skipped (counted as done). Failures are collected, not thrown — a missing
 * photo shouldn't abort a whole-area download.
 */
export const cacheUrls = async (
  urls: string[],
  onProgress?: (p: CacheProgress) => void,
  concurrency = 6,
): Promise<CacheResult> => {
  const cache = await caches.open(OFFLINE_CACHE);
  const cachedUrls: string[] = [];
  const failed: string[] = [];
  let bytes = 0;
  let done = 0;

  const unique = Array.from(new Set(urls));
  const queue = [...unique];

  const worker = async () => {
    while (queue.length) {
      const url = queue.shift()!;
      try {
        const existing = await cache.match(url);
        if (existing) {
          cachedUrls.push(url);
        } else {
          // cors for wikimedia; same-origin for our api. no-store so the
          // browser HTTP cache doesn't shadow what we deliberately persist.
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          bytes += bytesOf(response);
          await cache.put(url, response.clone());
          cachedUrls.push(url);
        }
      } catch {
        failed.push(url);
      } finally {
        done += 1;
        onProgress?.({ done, total: unique.length, failed: failed.length });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, unique.length) }, worker),
  );

  return { cachedUrls, failed, bytes };
};

// Removes URLs from OFFLINE_CACHE, keeping any that are still referenced
// elsewhere (passed in `keep`).
export const removeUrls = async (
  urls: string[],
  keep: Set<string> = new Set(),
): Promise<void> => {
  const cache = await caches.open(OFFLINE_CACHE);
  await Promise.all(
    urls.filter((u) => !keep.has(u)).map((u) => cache.delete(u)),
  );
};

// True when a feature's detail (GET /api/climbing-tiles/get) is already in the
// offline cache — whether downloaded directly or pulled in as part of a parent
// area. Lets us mark sectors as "saved offline" once their area is downloaded.
export const isFeatureCachedOffline = async (osmMeta: {
  type: string;
  id: number;
}): Promise<boolean> => {
  if (!isOfflineCacheSupported()) return false;
  const cache = await caches.open(OFFLINE_CACHE);
  return !!(await cache.match(getFeatureGetUrl(osmMeta)));
};

// Read a URL directly from the offline cache. Opens the specific cache and
// matches there — iOS Safari's global `caches.match()` is unreliable, while a
// specific `cache.match()` works. ignoreVary because our API responses carry
// `Vary: Accept-Encoding`.
export const matchOffline = async (
  url: string,
): Promise<Response | undefined> => {
  if (!isOfflineCacheSupported()) return undefined;
  const cache = await caches.open(OFFLINE_CACHE);
  return (await cache.match(url, { ignoreVary: true })) || undefined;
};

// How many of the given URLs are actually present in the offline cache.
// Diagnostic: tells apart a storage problem (low count) from a read problem.
export const countCachedUrls = async (urls: string[]): Promise<number> => {
  if (!isOfflineCacheSupported()) return 0;
  const cache = await caches.open(OFFLINE_CACHE);
  const present = await Promise.all(
    Array.from(new Set(urls)).map((u) =>
      cache.match(u, { ignoreVary: true }).then((r) => !!r),
    ),
  );
  return present.filter(Boolean).length;
};

// Actual size of the given URLs in the offline cache, summed from the response
// bodies. Reliable regardless of whether a Content-Length header was sent.
export const measureCachedBytes = async (urls: string[]): Promise<number> => {
  if (!isOfflineCacheSupported()) return 0;
  const cache = await caches.open(OFFLINE_CACHE);
  let total = 0;
  await Promise.all(
    Array.from(new Set(urls)).map(async (url) => {
      const res = await cache.match(url);
      if (!res) return;
      try {
        total += (await res.blob()).size;
      } catch {
        // ignore unreadable entries
      }
    }),
  );
  return total;
};

/**
 * Warms the app shell from the WINDOW: caches `/` (HTML) plus the entry
 * JS/CSS it references into the runtime cache. Runs on every online start.
 *
 * This is the reliable path — window-side cache writes are proven to work on
 * iOS (the area downloader uses them). The SW-side precache (activate event)
 * can be killed by iOS mid-way; this fills the gap so a cold OFFLINE launch
 * always finds a bootable shell instead of Safari's native
 * "not connected to the internet" error.
 */
export const warmAppShell = async (): Promise<void> => {
  if (!isOfflineCacheSupported()) return;
  try {
    const cache = await caches.open(OFFLINE_RUNTIME_CACHE);
    const res = await fetch('/', { cache: 'no-store' });
    if (!res.ok) return;
    await cache.put('/', res.clone());

    const html = await res.text();
    const re = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
    const chunks: string[] = [];
    let m: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((m = re.exec(html))) chunks.push(m[1]);

    await Promise.allSettled(
      chunks.map(async (url) => {
        // content-hashed = immutable; skip what's already cached
        if (await cache.match(url, { ignoreVary: true })) return;
        const r = await fetch(url);
        if (r.ok) await cache.put(url, r);
      }),
    );
  } catch {
    // offline or fetch failed — nothing to warm
  }
};

// Best-effort total disk used by the origin (all caches + IndexedDB). Browsers
// only expose an aggregate estimate, not a per-cache figure.
export const getStorageEstimate = async (): Promise<{
  usage: number;
  quota: number;
} | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
};
