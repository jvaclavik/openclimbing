import { getDb } from '../db/db';
import { OsmType } from '../../services/types';

export const CRAGS_CSV_DEFAULT_COUNTRIES = ['cz', 'sk'];

const DELIMITER = ';';
const COLUMNS = ['url', 'name', 'horosvaz', 'lat', 'lon', 'country'] as const;

const COORDINATE_DECIMALS = 7;

type Row = {
  osmType: OsmType;
  osmId: number;
  name: string | null;
  tags: string | null;
  countryCode: string | null;
  lon: number;
  lat: number;
};

// Only relations with at least one route drawn on a photo – these are the crags
// actually usable as a guide, `routesWithPhoto` is aggregated during refresh.
const getRows = (countryCodes: string[]): Row[] => {
  const placeholders = countryCodes.map(() => '?').join(',');
  return getDb()
    .prepare<string[], Row>(
      `SELECT "osmType", "osmId", COALESCE("name", "nameRaw") AS name, tags,
        "countryCode", lon, lat
       FROM climbing_features
       WHERE type IN ('area', 'crag') AND "osmType" = 'relation'
         AND "routesWithPhoto" > 0 AND "countryCode" IN (${placeholders})
       ORDER BY "countryCode", "osmId"`,
    )
    .all(...countryCodes);
};

const HOROSVAZ_URL_REGEX = /^https?:\/\/([^/]*\.)?horosvaz\.cz(\/|$)/i;

// `website`, `website:2`, `contact:website`, ... – the horosvaz link sits in an
// arbitrary one of them (`website` itself often holds an openclimbing selflink).
const isWebsiteKey = (key: string) => /(^|:)website(:\d+)?$/.test(key);

const getHorosvazUrl = (tagsJson: string | null): string => {
  if (!tagsJson) {
    return '';
  }
  try {
    const tags = JSON.parse(tagsJson) as Record<string, string>;
    const [url] = Object.keys(tags)
      .filter(isWebsiteKey)
      .sort() // deterministic pick when a crag links horosvaz from several tags
      .map((key) => (tags[key] ?? '').trim())
      .filter((value) => HOROSVAZ_URL_REGEX.test(value));
    return url ?? '';
  } catch {
    return '';
  }
};

const escapeCsvValue = (value: string) =>
  /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const toCsvLine = (values: string[]) =>
  values.map(escapeCsvValue).join(DELIMITER);

export const parseCountriesParam = (param: string | string[] | undefined) => {
  const raw = Array.isArray(param) ? param.join(',') : param;
  const countries = (raw ?? '')
    .split(',')
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean);

  return countries.length ? countries : CRAGS_CSV_DEFAULT_COUNTRIES;
};

/**
 * CSV listing of climbing areas and crags of given countries – one line per
 * relation which has at least one route drawn on a photo, `;` separated. The
 * `horosvaz` column is the horosvaz.cz link found in any of the website tags
 * (empty when the crag has none).
 */
export const getClimbingCragsCsv = (
  baseUrl: string,
  countryCodes: string[] = CRAGS_CSV_DEFAULT_COUNTRIES,
): string => {
  const lines = getRows(countryCodes).map((row) =>
    toCsvLine([
      `${baseUrl}/${row.osmType}/${row.osmId}`,
      row.name ?? '',
      getHorosvazUrl(row.tags),
      row.lat.toFixed(COORDINATE_DECIMALS),
      row.lon.toFixed(COORDINATE_DECIMALS),
      row.countryCode ?? '',
    ]),
  );

  return [toCsvLine([...COLUMNS]), ...lines].join('\n') + '\n';
};
