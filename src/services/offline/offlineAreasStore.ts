import { NamedBbox } from '../getCenter';
import { OFFLINE_AREAS_STORAGE_KEY } from './consts';

export type OfflineArea = {
  shortId: string; // e.g. "r123" — stable key, also used in the UI
  osmType: string;
  osmId: number;
  name: string;
  bbox: NamedBbox;
  urls: string[]; // every URL cached for this area (tiles + /get + photos)
  tileCount: number;
  featureCount: number;
  photoCount: number;
  bytes: number; // estimated total size of the response bodies
  createdAt: number; // epoch ms
};

const read = (): OfflineArea[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_AREAS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineArea[]) : [];
  } catch {
    return [];
  }
};

const write = (areas: OfflineArea[]) => {
  localStorage.setItem(OFFLINE_AREAS_STORAGE_KEY, JSON.stringify(areas));
};

export const listOfflineAreas = (): OfflineArea[] =>
  read().sort((a, b) => b.createdAt - a.createdAt);

export const getOfflineArea = (shortId: string): OfflineArea | undefined =>
  read().find((a) => a.shortId === shortId);

export const saveOfflineArea = (area: OfflineArea): void => {
  const areas = read().filter((a) => a.shortId !== area.shortId);
  areas.push(area);
  write(areas);
};

export const removeOfflineArea = (shortId: string): void => {
  write(read().filter((a) => a.shortId !== shortId));
};

// URLs still referenced by OTHER downloaded areas — must not be evicted from
// the cache when deleting `exceptShortId` (areas can share tiles/photos).
export const getSharedUrls = (exceptShortId: string): Set<string> => {
  const shared = new Set<string>();
  read()
    .filter((a) => a.shortId !== exceptShortId)
    .forEach((a) => a.urls.forEach((u) => shared.add(u)));
  return shared;
};
