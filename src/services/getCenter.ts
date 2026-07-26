import { BBox } from 'geojson';
import {
  Feature,
  FeatureGeometry,
  GeometryCollection,
  isGeometryCollection,
  isLineString,
  isPoint,
  isPolygon,
  LonLat,
} from './types';

export type NamedBbox = {
  w: number;
  s: number;
  e: number;
  n: number;
};

export const getBbox = (coordinates: LonLat[]): NamedBbox => {
  const [firstX, firstY] = coordinates[0];
  const initialBbox = { w: firstX, s: firstY, e: firstX, n: firstY };

  return coordinates.reduce(
    ({ w, s, e, n }, [x, y]) => ({
      w: Math.min(w, x),
      s: Math.min(s, y),
      e: Math.max(e, x),
      n: Math.max(n, y),
    }),
    initialBbox,
  );
};

const getCenterOfBbox = (points: LonLat[]): LonLat | undefined => {
  if (!points.length) return undefined;

  const { w, s, e, n } = getBbox(points);
  const lon = w + (e - w) / 2; // flat earth rulezz
  const lat = s + (n - s) / 2;

  return [lon, lat];
};

const getPointsRecursive = (geometry: GeometryCollection): LonLat[] =>
  geometry.geometries.flatMap((subGeometry) => getPoints(subGeometry));

const getPoints = (geometry: FeatureGeometry): LonLat[] => {
  if (isPoint(geometry)) {
    return [geometry.coordinates];
  }
  if (isLineString(geometry)) {
    return geometry.coordinates;
  }
  if (isPolygon(geometry)) {
    return geometry.coordinates.flat() as LonLat[];
  }
  if (isGeometryCollection(geometry)) {
    return getPointsRecursive(geometry);
  }
  return [];
};

const collectPoints = (feature: Feature, out: LonLat[]) => {
  out.push(...getPoints(feature.geometry));
  if (feature.center) {
    out.push(feature.center);
  }
  for (const member of feature.memberFeatures ?? []) {
    collectPoints(member, out);
  }
};

// Climbing features get `bbox` from the climbing-tiles API, everything else
// (OSM/Overpass) has to be measured here - from the geometry, the centers and
// the whole memberFeatures subtree.
export const getFeatureBbox = (feature: Feature): BBox | undefined => {
  if (feature.bbox) {
    return feature.bbox;
  }

  const points: LonLat[] = [];
  collectPoints(feature, points);
  if (!points.length) {
    return undefined;
  }

  const { w, s, e, n } = getBbox(points);
  return [w, s, e, n];
};

export const getCenter = (geometry: FeatureGeometry): LonLat => {
  if (isPoint(geometry)) {
    return geometry.coordinates;
  }

  if (isLineString(geometry)) {
    return getCenterOfBbox(geometry.coordinates);
  }

  if (isGeometryCollection(geometry)) {
    const allPoints = getPointsRecursive(geometry);
    return getCenterOfBbox(allPoints);
  }
  if (isPolygon(geometry)) {
    const outerCoords = geometry.coordinates[0] as LonLat[];
    return getCenterOfBbox(outerCoords);
  }

  return undefined;
};
