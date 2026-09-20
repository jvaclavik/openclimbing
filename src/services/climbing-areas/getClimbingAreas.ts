import { isServer } from '../../components/helpers';
import { fetchJson } from '../fetch';
import { CLIMBING_TILES_HOST } from '../osm/consts';
import type { ClimbingArea } from '../../server/climbing-tiles/getClimbingAreas';
import { ClimbingListType, isClimbingListType } from './climbingListTypes';

export type { ClimbingArea, ClimbingListType };

// When CLIMBING_TILES_HOST is '/', we are the canonical host that owns the
// SQLite DB (production openclimbing.org, or local dev with
// NEXT_PUBLIC_CLIMBING_TILES_LOCAL). Otherwise (e.g. Vercel preview, which has
// no DB deployed) the data lives on openclimbing.org, so we fetch it from there
// - exactly like the climbing tiles / search / get endpoints.
const isCanonicalHost = CLIMBING_TILES_HOST === '/';

const getFromSqlite = async (
  listType: ClimbingListType,
): Promise<ClimbingArea[]> => {
  const { getClimbingAreas: getFromDb } = await import(
    '../../server/climbing-tiles/getClimbingAreas'
  );
  return getFromDb(listType);
};

const getFromApi = async (
  listType: ClimbingListType,
): Promise<ClimbingArea[]> =>
  fetchJson<ClimbingArea[]>(
    `${CLIMBING_TILES_HOST}api/climbing-tiles/areas?type=${listType}`,
  );

export const getClimbingAreas = async (
  listType: ClimbingListType = 'rock',
): Promise<ClimbingArea[]> => {
  const type = isClimbingListType(listType) ? listType : 'rock';
  try {
    // Read the local DB directly only when we own it and run on the server;
    // in every other case go through the (possibly remote) API endpoint.
    if (isCanonicalHost && isServer()) {
      return await getFromSqlite(type);
    }
    return await getFromApi(type);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('getClimbingAreas failed', e);
    return [];
  }
};
