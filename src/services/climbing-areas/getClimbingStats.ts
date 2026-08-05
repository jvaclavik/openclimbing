import { isServer } from '../../components/helpers';
import type { ClimbingStatsResponse } from '../../types';
import { fetchJson } from '../fetch';
import { CLIMBING_TILES_HOST } from '../osm/consts';

// see getClimbingAreas.ts for why the canonical host reads SQLite directly
const isCanonicalHost = CLIMBING_TILES_HOST === '/';

const getFromSqlite = async (): Promise<ClimbingStatsResponse> => {
  const { getClimbingStats: getFromDb } = await import(
    '../../server/climbing-tiles/getClimbingStats'
  );
  return getFromDb();
};

// fetchJson caches by URL (sessionStorage in dev, forever) - bump when the
// shape of the response changes, otherwise clients keep the old one
const VERSION = 3; // bump: routesWithPhotoCount now sums crags, not nested areas

export const CLIMBING_STATS_URL = `${CLIMBING_TILES_HOST}api/climbing-tiles/stats?v=${VERSION}`;

const getFromApi = async (): Promise<ClimbingStatsResponse> =>
  fetchJson<ClimbingStatsResponse>(CLIMBING_STATS_URL);

export const getClimbingStats =
  async (): Promise<ClimbingStatsResponse | null> => {
    try {
      if (isCanonicalHost && isServer()) {
        return await getFromSqlite();
      }
      return await getFromApi();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('getClimbingStats failed', e);
      return null;
    }
  };
