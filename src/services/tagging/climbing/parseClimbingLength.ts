export type LengthMeters = { min: number; max: number };

const FEET_TO_METERS = 0.3048;

const toNumber = (raw: string): number | null => {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized || normalized === '?' || normalized === '-') {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const stripApproxPrefix = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    // ~30m, approx 30m, ca. 30m, about 30m, +/- 30m
    .replace(/^(?:~|≈|±|\+\/-|approx\.?|about|ca\.?|cca\.?)\s*/i, '')
    .replace(/^[<>]=?\s*/, '')
    .replace(/\+$/, '')
    .trim();

const parseSingle = (raw: string): number | null => {
  const s = stripApproxPrefix(raw.replace(/\s+/g, ' '));
  if (!s || s === '?' || s === '-' || s === 'unknown' || s === '0') {
    return null;
  }

  // 100', 100′, 12'6" (take feet only), 60ft, 60 ft, 60 feet
  const feet = s.match(
    /^(\d+(?:[.,]\d+)?)\s*(?:'|′|ft|feet)(?:\s*\d+(?:[.,]\d+)?\s*(?:"|″|in|inch|inches)?)?/,
  );
  if (feet) {
    const value = toNumber(feet[1]);
    return value === null ? null : value * FEET_TO_METERS;
  }

  // 20m, 20 m, 20.00 m, 20metres, 20 meters – allow trailing junk after unit
  const meters = s.match(
    /^(\d+(?:[.,]\d+)?)\s*(?:metres|meters|metre|meter|m)\b/,
  );
  if (meters) {
    return toNumber(meters[1]);
  }

  // bare number = metres (OSM climbing:length convention)
  const bare = s.match(/^(\d+(?:[.,]\d+)?)/);
  if (bare && /^(\d+(?:[.,]\d+)?)$/.test(s)) {
    const value = toNumber(bare[1]);
    return value === 0 ? null : value;
  }

  return null;
};

/**
 * Parse OSM `climbing:length` into metres.
 * Handles bare numbers (metres), `m`/`ft`/`'`, decimals with `,`/`.`,
 * approximate prefixes (`~30m`), and simple ranges like `15-20m`.
 */
export const parseClimbingLengthMeters = (
  raw?: string,
): LengthMeters | null => {
  if (!raw?.trim()) {
    return null;
  }

  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ');

  // 15-20m, 15 – 20, 10m-15m
  const range = s.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (range) {
    const a = parseSingle(range[1]);
    const b = parseSingle(range[2]);
    if (a === null && b === null) {
      return null;
    }
    if (a === null) {
      return { min: b!, max: b! };
    }
    if (b === null) {
      return { min: a, max: a };
    }
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const value = parseSingle(s);
  return value === null ? null : { min: value, max: value };
};

export const LENGTH_FILTER_MAX_M = 100;
export const DEFAULT_LENGTH_INTERVAL: [number, number] = [
  0,
  LENGTH_FILTER_MAX_M,
];

/** Upper slider stop means "and longer" (no cap). */
export const effectiveLengthFilterMax = (maxM: number) =>
  maxM >= LENGTH_FILTER_MAX_M ? Number.POSITIVE_INFINITY : maxM;

export const lengthOverlapsFilter = (
  length: LengthMeters | null | undefined,
  filterMinM: number,
  filterMaxM: number,
): boolean => {
  if (!length) {
    return false;
  }
  const max = effectiveLengthFilterMax(filterMaxM);
  return length.min <= max && length.max >= filterMinM;
};
