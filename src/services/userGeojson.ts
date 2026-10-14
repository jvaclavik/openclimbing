import type { FeatureCollection, Point } from 'geojson';

export const USER_GEOJSON_STORAGE_KEY = 'userGeojsonLayers';
// localStorage is ~5 MB per site; keep room for the rest of the app
export const USER_GEOJSON_MAX_FILE_BYTES = 2 * 1024 * 1024;
export const GEOJSON_NAME_PROPERTY = 'name';
export const GEOJSON_LINK_PROPERTY = 'link';
// set on every point from its layer color; hidden from the popup
export const USER_GEOJSON_COLOR_PROPERTY = '__color';
// set on every point to the id of its layer; used to close its popup
export const USER_GEOJSON_LAYER_PROPERTY = '__layerId';

export type UserGeojsonProperties = Record<
  string,
  string | number | boolean | null
>;

export type UserGeojsonPoints = FeatureCollection<Point, UserGeojsonProperties>;

export type UserGeojsonLayer = {
  id: string;
  name: string;
  color?: string;
  data: UserGeojsonPoints;
};

export type GeojsonParseErrorCode = 'invalid' | 'no_points';

export class GeojsonParseError extends Error {
  code: GeojsonParseErrorCode;

  constructor(code: GeojsonParseErrorCode) {
    super(code);
    this.code = code;
  }
}

// FNV-1a hash, so the same name always gets the same color
const hashString = (text: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
};

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const s = saturation / 100;
  const l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
};

/** Stable color for a file name, e.g. `#c2410c`. Saturation and lightness are fixed so every color stays readable on the map. */
export const colorFromName = (name: string) =>
  hslToHex(hashString(name) % 360, 70, 45);

export const getUserGeojsonColor = (layer: UserGeojsonLayer) =>
  layer.color ?? colorFromName(layer.name);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidPosition = (position: unknown): position is [number, number] => {
  if (!Array.isArray(position) || position.length < 2) return false;
  const [lon, lat] = position;
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Math.abs(lon) <= 180 &&
    Math.abs(lat) <= 90
  );
};

const toProperties = (properties: unknown): UserGeojsonProperties => {
  if (!isRecord(properties)) return {};
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([, value]) =>
        value === null ||
        ['string', 'number', 'boolean'].includes(typeof value),
    ),
  ) as UserGeojsonProperties;
};

const toFeatures = (json: unknown): unknown[] => {
  if (!isRecord(json)) throw new GeojsonParseError('invalid');

  if (json.type === 'FeatureCollection') {
    if (!Array.isArray(json.features)) throw new GeojsonParseError('invalid');
    return json.features;
  }
  if (json.type === 'Feature') return [json];
  if (json.type === 'Point' || json.type === 'MultiPoint') {
    return [{ type: 'Feature', geometry: json, properties: null }];
  }
  throw new GeojsonParseError('invalid');
};

// Only Point and MultiPoint geometries are kept. Other geometry types are skipped.
const toPoints = (feature: unknown): UserGeojsonPoints['features'] => {
  if (!isRecord(feature) || !isRecord(feature.geometry)) return [];

  const { geometry } = feature;
  let positions: unknown[] = [];
  if (geometry.type === 'Point') {
    positions = [geometry.coordinates];
  } else if (
    geometry.type === 'MultiPoint' &&
    Array.isArray(geometry.coordinates)
  ) {
    positions = geometry.coordinates;
  }

  const properties = toProperties(feature.properties);
  return positions.filter(isValidPosition).map((coordinates) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties,
  }));
};

export const parseGeojsonPoints = (text: string): UserGeojsonPoints => {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new GeojsonParseError('invalid');
  }

  const features = toFeatures(json).flatMap(toPoints);
  if (!features.length) throw new GeojsonParseError('no_points');

  return { type: 'FeatureCollection', features };
};

/**
 * Only absolute http(s) URLs are allowed, so a `javascript:` link from a
 * GeoJSON file can never become clickable.
 */
export const getSafeHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
};
