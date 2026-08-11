import { BBox, Feature as GeojsonFeature, Geometry } from 'geojson';
import { ClimbingTilesFeature, ClimbingTilesProperties } from '../../types';
import { LineString, OsmId } from '../../services/types';
import { ClimbingFeaturesRow } from '../db/types';
import { parseClimbingLengthMeters } from '../../services/tagging/climbing/parseClimbingLength';

// rows or columns count
const COUNT = 500;

const isBetterForCell = (
  feature: ClimbingTilesFeature,
  current: ClimbingTilesFeature | null,
): boolean => {
  if (!current) {
    return true;
  }

  const count = feature.properties.routeCount ?? 0;
  const currentCount = current.properties.routeCount ?? 0;
  if (count !== currentCount) {
    return count > currentCount;
  }

  // an area with a single crag has the same routeCount as the crag - the area
  // is the one to show at these zooms, see AREA_HANDOVER_ZOOM in groupsLayer
  return (
    feature.properties.type === 'area' && current.properties.type !== 'area'
  );
};

const optimizeFeaturesToGrid = (
  features: ClimbingTilesFeature[],
  [west, south, east, north]: BBox,
): ClimbingTilesFeature[] => {
  const intervalX = (east - west) / COUNT;
  const intervalY = (north - south) / COUNT;
  const grid = Array.from({ length: COUNT }, () =>
    Array.from({ length: COUNT }, () => null as ClimbingTilesFeature | null),
  );

  for (const feature of features) {
    if (!feature.geometry || feature.geometry.type !== 'Point') {
      continue;
    }

    const [lon, lat] = feature.geometry.coordinates;

    if (lon >= west && lon <= east && lat >= south && lat <= north) {
      const xIndex = Math.floor((lon - west) / intervalX);
      const yIndex = Math.floor((lat - south) / intervalY);
      if (isBetterForCell(feature, grid[xIndex][yIndex])) {
        grid[xIndex][yIndex] = feature;
      }
    }
  }

  return grid.flat().filter((f) => f !== null);
};

export const convertOsmIdToMapId = (apiId: OsmId) => {
  const osmToMapType = { node: 0, way: 1, relation: 4 };
  return parseInt(`${apiId.id}${osmToMapType[apiId.type]}`, 10);
};

const decodeList = (value?: string | null): string[] | undefined =>
  value ? value.split(',') : undefined;

const lengthFromRecord = (record: ClimbingFeaturesRow) => {
  if (record.lengthMin != null || record.lengthMax != null) {
    return {
      lengthMin: record.lengthMin ?? record.lengthMax ?? undefined,
      lengthMax: record.lengthMax ?? record.lengthMin ?? undefined,
    };
  }
  if (!record.tags) {
    return {};
  }
  try {
    const tags = JSON.parse(record.tags) as Record<string, string>;
    const values = [
      parseClimbingLengthMeters(tags['climbing:length']),
      parseClimbingLengthMeters(tags['climbing:length:min']),
      parseClimbingLengthMeters(tags['climbing:length:max']),
    ].filter(Boolean);
    if (values.length === 0) return {};
    return {
      lengthMin: Math.min(...values.map((v) => v!.min)),
      lengthMax: Math.max(...values.map((v) => v!.max)),
    };
  } catch {
    return {};
  }
};

const getAttributeProperties = (record: ClimbingFeaturesRow) => ({
  materials: decodeList(record.materials),
  climbingTypes: decodeList(record.climbingTypes),
  inclinations: decodeList(record.inclinations),
  familyFriendly: record.familyFriendly ? true : undefined,
  ...lengthFromRecord(record),
});

export const getProperties = (
  record: ClimbingFeaturesRow,
): ClimbingTilesProperties => {
  const { type, parentId } = record;
  const name = record.name || record.nameRaw;

  if (type === 'area' || type === 'crag') {
    const {
      routeCount = 0,
      hasImages,
      histogramCode,
      routesWithPhoto,
    } = record;
    return {
      type,
      name,
      parentId,
      routeCount,
      routesWithPhoto: routesWithPhoto ?? 0,
      hasImages: hasImages > 0, // TODO maybe use number as in sqlite?
      histogramCode,
      ...getAttributeProperties(record),
    };
  }

  if (type === 'route' || type === 'route_top') {
    const { gradeId, gradeTxt, hasImages } = record;
    return {
      type,
      name,
      parentId,
      gradeId,
      gradeTxt,
      hasImages: hasImages > 0 ? true : undefined,
      ...getAttributeProperties(record),
    };
  }

  if (type === 'gym' || type === 'ferrata') {
    return { type, name, parentId };
  }

  return undefined;
};

const buildGeojson = (record: ClimbingFeaturesRow): ClimbingTilesFeature => {
  const { osmType, osmId, line, lon, lat } = record;
  const id = convertOsmIdToMapId({ type: osmType, id: osmId });
  const properties = getProperties(record);
  const geometry: Geometry = line
    ? { type: 'LineString', coordinates: JSON.parse(line) }
    : { type: 'Point', coordinates: [lon, lat] };

  return { type: 'Feature', id, geometry, properties };
};

const isRouteLineString = (
  f: ClimbingTilesFeature,
): f is GeojsonFeature<LineString, ClimbingTilesProperties> => {
  return f.properties.type === 'route' && f.geometry?.type === 'LineString';
};

const firstPointGeometry = (
  feature: GeojsonFeature<LineString, ClimbingTilesProperties>,
): ClimbingTilesFeature => {
  // Unique id (suffix 2) — sharing the LineString id breaks MapLibre feature-state.
  const osmId = Math.floor(Number(feature.id) / 10);
  return {
    ...feature,
    id: osmId * 10 + 2,
    geometry: {
      type: 'Point',
      coordinates: feature.geometry.coordinates[0],
    },
  };
};

const addRouteStarts = (features: ClimbingTilesFeature[]) => [
  ...features,
  ...features.filter(isRouteLineString).map(firstPointGeometry),
];

const isGymOrFerrata = (f: ClimbingTilesFeature) =>
  f.properties.type === 'gym' || f.properties.type === 'ferrata';

export const buildTileGeojson = (
  isOptimizedToGrid: boolean,
  recordsInBbox: ClimbingFeaturesRow[],
  bbox: BBox,
): GeoJSON.FeatureCollection => {
  const featuresInBbox = recordsInBbox.map(buildGeojson);

  let features: ClimbingTilesFeature[];
  if (isOptimizedToGrid) {
    const gymsAndFerratas = featuresInBbox.filter(isGymOrFerrata);
    const rest = featuresInBbox.filter((f) => !isGymOrFerrata(f));
    features = [...optimizeFeaturesToGrid(rest, bbox), ...gymsAndFerratas];
  } else {
    features = featuresInBbox;
  }

  return {
    type: 'FeatureCollection' as const,
    features: addRouteStarts(features),
  };
};
