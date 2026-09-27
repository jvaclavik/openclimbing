import { toPoint } from 'mgrs';
import { OpenLocationCode } from 'open-location-code';
import { LonLat } from '../../../services/types';

export type CoordsFormat = 'degrees' | 'OpenLocationCode' | 'MGRS';

export type ParsedCoords = {
  center: LonLat;
  format: CoordsFormat;
};

const MAX_LENGTH = 64; // nothing longer can be a coordinate

const olc = new OpenLocationCode();

const parseOlc = (input: string): LonLat | null => {
  try {
    const { longitudeCenter, latitudeCenter } = olc.decode(input.toUpperCase());
    return [longitudeCenter, latitudeCenter];
  } catch {
    return null;
  }
};

// `33UWR55061853` – zone, band, 100km square and an even number of digits
const mgrsRegex = /^\d{1,2}[C-HJ-NP-X][A-HJ-NP-Z][A-HJ-NP-V](?:\d{2}){0,5}$/i;

const parseMgrs = (input: string): LonLat | null => {
  const compact = input.replace(/\s/g, '').toUpperCase(); // often written as `33U WR 5506 1853`
  if (!mgrsRegex.test(compact)) {
    return null;
  }
  try {
    return toPoint(compact); // center of the square
  } catch {
    return null;
  }
};

// one half of a pair – `15.7653808E`, `E 15°45.92285'` or `15°45'55.371"E`
const degreesRegex =
  /^\s*(?:([NSEW])\s*)?(-?\d{1,3}(?:[.,]\d+)?)\s*[°º]?\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*['′’]\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*["″”]?\s*)?)?(?:([NSEW])\s*)?$/i;

type Axis = 'lat' | 'lon';
type Part = { value: number; axis: Axis | null };

const toNumber = (value: string) => Number(value.replace(',', '.')); // decimal comma, eg. `47,32599`

const getAxis = (hemisphere: string | undefined): Axis | null => {
  if (hemisphere === 'N' || hemisphere === 'S') {
    return 'lat';
  }
  if (hemisphere === 'E' || hemisphere === 'W') {
    return 'lon';
  }
  return null;
};

const getOppositeAxis = (axis: Axis | null): Axis | null => {
  if (axis === 'lat') {
    return 'lon';
  }
  if (axis === 'lon') {
    return 'lat';
  }
  return null;
};

const parsePart = (input: string): Part | null => {
  const match = input.match(degreesRegex);
  if (!match) {
    return null;
  }

  const [, prefix, degreesStr, minutesStr, secondsStr, suffix] = match;
  if (prefix && suffix) {
    return null; // eg. `N 49N`
  }

  const hemisphere = (prefix ?? suffix)?.toUpperCase();
  const isNegative = degreesStr.startsWith('-');
  if (hemisphere && isNegative) {
    return null; // eg. `-49N`
  }

  const degrees = Math.abs(toNumber(degreesStr));
  const minutes = minutesStr ? toNumber(minutesStr) : 0;
  const seconds = secondsStr ? toNumber(secondsStr) : 0;
  if (minutes >= 60 || seconds >= 60) {
    return null;
  }
  if (minutesStr && !Number.isInteger(degrees)) {
    return null; // eg. `49.5°30'`
  }
  if (secondsStr && !Number.isInteger(minutes)) {
    return null; // eg. `49°30.5'15"`
  }

  const isSouthOrWest = hemisphere === 'S' || hemisphere === 'W';
  const sign = isNegative || isSouthOrWest ? -1 : 1;
  return {
    value: sign * (degrees + minutes / 60 + seconds / 3600),
    axis: getAxis(hemisphere),
  };
};

const isValidCoord = ([lon, lat]: LonLat) =>
  lon < 180 && lon > -180 && lat < 90 && lat > -90;

const getCenters = (first: Part, second: Part): LonLat[] => {
  if (first.axis && second.axis && first.axis === second.axis) {
    return []; // eg. `49N 15N`
  }

  const firstAxis = first.axis ?? getOppositeAxis(second.axis);
  if (firstAxis === 'lat') {
    return [[second.value, first.value]];
  }
  if (firstAxis === 'lon') {
    return [[first.value, second.value]];
  }

  // without a hemisphere we can't tell the order, offer both interpretations
  return [
    [second.value, first.value],
    [first.value, second.value],
  ];
};

const parseDegreesPair = (input: string): LonLat[] => {
  for (let i = 0; i < input.length; i += 1) {
    if (!/[\s,;]/.test(input[i])) {
      continue; // the pair can be split by any of these, `,` is a decimal separator too
    }

    const first = parsePart(input.slice(0, i));
    const second = parsePart(input.slice(i + 1));
    if (first && second) {
      const centers = getCenters(first, second).filter(isValidCoord);
      if (centers.length) {
        return centers;
      }
    }
  }
  return [];
};

export const parseCoords = (inputValue: string): ParsedCoords[] => {
  const input = inputValue.trim();
  if (!input || input.length > MAX_LENGTH) {
    return [];
  }

  const olcCenter = parseOlc(input);
  if (olcCenter) {
    return [{ center: olcCenter, format: 'OpenLocationCode' }];
  }

  const mgrsCenter = parseMgrs(input);
  if (mgrsCenter) {
    return [{ center: mgrsCenter, format: 'MGRS' }];
  }

  return parseDegreesPair(input).map((center) => ({
    center,
    format: 'degrees',
  }));
};
