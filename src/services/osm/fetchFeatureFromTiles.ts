import { Feature, OsmId } from '../types';
import { ClimbingFeatureFull } from '../../types';
import { fetchJson } from '../fetch';
import { isServer } from '../../components/helpers';
import { addSchemaToFeature } from '../tagging/idTaggingScheme';
import { fetchSchemaTranslations } from '../tagging/translations';
import { getShortId } from '../helpers';
import { CLIMBING_TILES_HOST } from './consts';
import { matchOffline } from '../offline/offlineCache';
import { fetchFeature } from './osmApi';
import { wasRecentlyEdited } from './recentlyEditedFeatures';

/**
 * The GET /api/climbing-tiles/get response is already shaped as a GeoJSON
 * `Feature` (see ClimbingFeatureFull / getClimbingFeature()). The only thing
 * missing for the FeaturePanel is the derived `schema`, which is computed here
 * on the FE from `tags` (same as the OSM path in fetchFeature()).
 */
const toFeature = async (full: ClimbingFeatureFull): Promise<Feature> => {
  try {
    await fetchSchemaTranslations(); // needed by addSchemaToFeature()
    return addSchemaToFeature(full as unknown as Feature);
  } catch (e) {
    // The schema is a nice-to-have. If anything around it fails (e.g. offline
    // translation loading), show the feature without it rather than cascading
    // into the OSM fallback — which offline always ends in a network error,
    // even with the feature data already in hand.
    console.warn('toFeature(): schema failed, using bare feature', e); // eslint-disable-line no-console
    return full as unknown as Feature;
  }
};

// On the server we read the local SQLite DB directly (no network round-trip).
// The dynamic import keeps better-sqlite3 out of the client bundle - it is
// aliased away for the browser build in next.config.mjs.
const getFromSqlite = async (apiId: OsmId): Promise<ClimbingFeatureFull> => {
  const { getClimbingFeature } = await import(
    '../../server/climbing-tiles/getClimbingFeature'
  );
  return getClimbingFeature(apiId.type, apiId.id);
};

const getFromApi = async (apiId: OsmId): Promise<ClimbingFeatureFull> => {
  const url = `${CLIMBING_TILES_HOST}api/climbing-tiles/get?osmType=${apiId.type}&osmId=${apiId.id}`;
  try {
    return await fetchJson<ClimbingFeatureFull>(url);
  } catch (e) {
    // Offline fallback: read the downloaded response straight from the offline
    // cache, bypassing the service worker (iOS Safari's SW cache matching is
    // unreliable). matchOffline opens the specific cache — the global
    // caches.match() misses on iOS.
    const cached = await matchOffline(url);
    if (cached) return cached.json();
    throw e;
  }
};

/**
 * Fetches a full feature from the climbing-tiles SQLite DB:
 *  - on the server it calls the select code directly,
 *  - in the browser it hits the GET /api/climbing-tiles/get endpoint.
 *
 * On ANY failure (feature not in DB -> 404, missing db.sqlite / 500, network,
 * non-climbing POI, ...) it transparently falls back to the original
 * fetchFeature() which pulls fresh data from OSM / Overpass.
 *
 * NOTE: intended only for the initial (SSR / router) feature load. The
 * EditDialog and the "Reload fresh data from OpenStreetMap" button must keep
 * using fetchFeature() directly so they always get up-to-date OSM data.
 */
export const fetchFeatureFromTiles = async (apiId: OsmId): Promise<Feature> => {
  // A feature edited in this session must always come fresh from OSM - the
  // climbing-tiles DB only refreshes nightly and would show the pre-edit state.
  if (wasRecentlyEdited(apiId)) {
    return fetchFeature(apiId);
  }

  try {
    const full = isServer()
      ? await getFromSqlite(apiId)
      : await getFromApi(apiId);
    return await toFeature(full);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(
      `fetchFeatureFromTiles(${getShortId(apiId)}) falling back to OSM:`,
      e instanceof Error ? e.message : e,
    );
    return fetchFeature(apiId);
  }
};
