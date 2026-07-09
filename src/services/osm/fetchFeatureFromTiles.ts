import { Feature, OsmId } from '../types';
import { ClimbingFeatureFull } from '../../types';
import { fetchJson } from '../fetch';
import { isServer } from '../../components/helpers';
import { addSchemaToFeature } from '../tagging/idTaggingScheme';
import { fetchSchemaTranslations } from '../tagging/translations';
import { getShortId } from '../helpers';
import { CLIMBING_TILES_HOST } from './consts';
import { fetchFeature } from './osmApi';

/**
 * The GET /api/climbing-tiles/get response is already shaped as a GeoJSON
 * `Feature` (see ClimbingFeatureFull / getClimbingFeature()). The only thing
 * missing for the FeaturePanel is the derived `schema`, which is computed here
 * on the FE from `tags` (same as the OSM path in fetchFeature()).
 */
const toFeature = async (full: ClimbingFeatureFull): Promise<Feature> => {
  await fetchSchemaTranslations(); // needed by addSchemaToFeature()
  return addSchemaToFeature(full as unknown as Feature);
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
  return fetchJson<ClimbingFeatureFull>(url);
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
