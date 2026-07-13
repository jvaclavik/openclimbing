import { ClimbingFeatureFull } from '../../types';
import { Feature } from '../types';
import { getShortId } from '../helpers';
import { collectAreaUrls, getFeatureGetUrl } from './collectAreaUrls';
import {
  cacheUrls,
  CacheProgress,
  measureCachedBytes,
  removeUrls,
} from './offlineCache';
import {
  getOfflineArea,
  getSharedUrls,
  OfflineArea,
  removeOfflineArea,
  saveOfflineArea,
} from './offlineAreasStore';
import { OFFLINE_APP_SHELL_URLS } from './consts';

export type DownloadPhase = 'resolving' | 'downloading' | 'done';

export type DownloadProgress = CacheProgress & { phase: DownloadPhase };

const getAreaName = (feature: Feature): string =>
  feature.tags?.name ||
  (feature.properties?.name as string) ||
  getShortId(feature.osmMeta);

const fetchFull = async (feature: Feature): Promise<ClimbingFeatureFull> => {
  const url = getFeatureGetUrl(feature.osmMeta);
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load area data (HTTP ${response.status})`);
  }
  return response.json();
};

// The app shell (home page HTML) plus the /_next/static JS/CSS it references,
// so the PWA can cold-boot offline without relying on which chunks happened to
// be cached while browsing. Dynamic (code-split) chunks still come from the
// runtime cache populated during online use.
const collectAppShellUrls = async (): Promise<string[]> => {
  const urls = new Set<string>(OFFLINE_APP_SHELL_URLS);
  try {
    const res = await fetch('/', { cache: 'no-store' });
    if (res.ok) {
      const html = await res.text();
      const re = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
      let m: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(html))) urls.add(m[1]);
    }
  } catch {
    // offline / fetch failed — fall back to just the shell URLs
  }
  return Array.from(urls);
};

/**
 * Downloads a crag/area (and its child routes, tiles and topo photos) into the
 * offline cache and records it in the offline-areas index. Safe to re-run to
 * refresh an already-downloaded area.
 */
export const downloadArea = async (
  feature: Feature,
  onProgress?: (p: DownloadProgress) => void,
): Promise<OfflineArea> => {
  onProgress?.({ phase: 'resolving', done: 0, total: 0, failed: 0 });

  const full = await fetchFull(feature);
  const { bbox, featureUrls, tileUrls, photoUrls, featureCount, photoCount } =
    collectAreaUrls(full);

  const urls = [
    ...(await collectAppShellUrls()),
    ...featureUrls,
    ...tileUrls,
    ...photoUrls,
  ];

  const result = await cacheUrls(urls, (p) =>
    onProgress?.({ phase: 'downloading', ...p }),
  );

  const area: OfflineArea = {
    shortId: getShortId(feature.osmMeta),
    osmType: feature.osmMeta.type,
    osmId: feature.osmMeta.id,
    name: getAreaName(feature),
    bbox,
    urls: result.cachedUrls,
    tileCount: tileUrls.length,
    featureCount,
    photoCount,
    // Measured from the cached bodies (Content-Length is often absent).
    bytes: await measureCachedBytes(result.cachedUrls),
    createdAt: Date.now(),
  };
  saveOfflineArea(area);

  onProgress?.({
    phase: 'done',
    done: urls.length,
    total: urls.length,
    failed: result.failed.length,
  });

  return area;
};

/**
 * Removes a downloaded area: evicts its cached URLs (except those still shared
 * with other downloaded areas) and drops the index entry.
 */
export const deleteArea = async (shortId: string): Promise<void> => {
  const area = getOfflineArea(shortId);
  if (!area) return;
  // Never evict the shared app shell, or URLs another area still needs.
  const keep = getSharedUrls(shortId);
  OFFLINE_APP_SHELL_URLS.forEach((u) => keep.add(u));
  await removeUrls(area.urls, keep);
  removeOfflineArea(shortId);
};
