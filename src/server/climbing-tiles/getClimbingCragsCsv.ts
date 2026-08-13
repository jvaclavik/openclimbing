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

const getRows = (countryCodes: string[]): Row[] => {
  const placeholders = countryCodes.map(() => '?').join(',');
  return getDb()
    .prepare<string[], Row>(
      `SELECT "osmType", "osmId", COALESCE("name", "nameRaw") AS name, tags,
        "countryCode", lon, lat
       FROM climbing_features
       WHERE type IN ('area', 'crag') AND "countryCode" IN (${placeholders})
       ORDER BY "countryCode", "osmType", "osmId"`,
    )
    .all(...countryCodes);
};

const getWebsite = (tagsJson: string | null): string => {
  if (!tagsJson) {
    return '';
  }
  try {
    const tags = JSON.parse(tagsJson) as Record<string, string>;
    return tags.website ?? '';
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
 * CSV listing of all climbing areas and crags of given countries – one line per
 * feature, `;` separated. The `horosvaz` column is the OSM `website` tag, which
 * for Czech crags usually points to horosvaz.cz (hence the legacy column name).
 */
export const getClimbingCragsCsv = (
  baseUrl: string,
  countryCodes: string[] = CRAGS_CSV_DEFAULT_COUNTRIES,
): string => {
  const lines = getRows(countryCodes).map((row) =>
    toCsvLine([
      `${baseUrl}/${row.osmType}/${row.osmId}`,
      row.name ?? '',
      getWebsite(row.tags),
      row.lat.toFixed(COORDINATE_DECIMALS),
      row.lon.toFixed(COORDINATE_DECIMALS),
      row.countryCode ?? '',
    ]),
  );

  return [toCsvLine([...COLUMNS]), ...lines].join('\n') + '\n';
};
