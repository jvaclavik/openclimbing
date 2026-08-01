import { isServer } from '../../components/helpers';
import { fetchJson } from '../fetch';
import { CLIMBING_TILES_HOST } from '../osm/consts';
import type { ClimbingGalleryItem } from '../../server/climbing-tiles/getClimbingGallery';

export type { ClimbingGalleryItem };

// see getClimbingAreas.ts for why the canonical host reads SQLite directly
const isCanonicalHost = CLIMBING_TILES_HOST === '/';

const getFromSqlite = async (): Promise<ClimbingGalleryItem[]> => {
  const { getClimbingGallery: getFromDb } = await import(
    '../../server/climbing-tiles/getClimbingGallery'
  );
  return getFromDb();
};

// fetchJson caches by URL (sessionStorage in dev, forever) - bump when the
// shape of the response changes, otherwise clients keep the old one
const VERSION = 2;

const getFromApi = async (): Promise<ClimbingGalleryItem[]> =>
  fetchJson<ClimbingGalleryItem[]>(
    `${CLIMBING_TILES_HOST}api/climbing-tiles/gallery?v=${VERSION}`,
  );

export const getClimbingGallery = async (): Promise<ClimbingGalleryItem[]> => {
  try {
    if (isCanonicalHost && isServer()) {
      return await getFromSqlite();
    }
    return await getFromApi();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('getClimbingGallery failed', e);
    return [];
  }
};
