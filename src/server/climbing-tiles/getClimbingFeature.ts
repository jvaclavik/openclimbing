import { Geometry } from 'geojson';
import { getDb } from '../db/db';
import { ClimbingFeaturesRow } from '../db/types';
import { ClimbingFeatureFull } from '../../types';
import { OsmType } from '../../services/types';
import { convertOsmIdToMapId, getProperties } from './buildTileGeojson';
import { decodeHistogram } from './overpass/histogram';

const mapTypeToOsm: Record<string, OsmType> = {
  '0': 'node',
  '1': 'way',
  '4': 'relation',
};

// reverse of convertOsmIdToMapId() - last digit is the osm type marker
export const decodeMapId = (mapId: number): { type: OsmType; id: number } => {
  const str = String(mapId);
  const type = mapTypeToOsm[str.slice(-1)];
  if (!type) {
    throw new Error(`Invalid mapId: ${mapId}`);
  }
  return { type, id: Number(str.slice(0, -1)) };
};

export const getClimbingFeature = (
  osmType: OsmType,
  osmId: number,
): ClimbingFeatureFull => {
  const row = getDb()
    .prepare<
      [string, number],
      ClimbingFeaturesRow
    >(`SELECT * FROM climbing_features WHERE "osmType" = ? AND "osmId" = ?`)
    .get(osmType, osmId);

  if (!row) {
    throw new Error(`Feature ${osmType}/${osmId} not found`);
  }

  const { line, lon, lat, tags, members, histogramCode } = row;

  const geometry: Geometry = line
    ? { type: 'LineString', coordinates: JSON.parse(line) }
    : { type: 'Point', coordinates: [lon, lat] };

  const properties = {
    ...getProperties(row),
    histogram: histogramCode ? decodeHistogram(histogramCode) : undefined,
  };

  return {
    type: 'Feature',
    id: convertOsmIdToMapId({ type: osmType, id: osmId }),
    osmMeta: { type: osmType, id: osmId },
    tags: tags ? JSON.parse(tags) : {},
    members: members ? JSON.parse(members) : undefined,
    center: [lon, lat],
    geometry,
    properties,
  };
};
