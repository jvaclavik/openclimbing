import raw from './ferrataMeasures.json';

/** Slider stop. The top value means this length or longer. */
export const FERRATA_LENGTH_MAX_M = 1500;
/** Straight span of the drawn line. The top value means this far or farther. */
export const FERRATA_SPAN_MAX_M = 1000;
/** Elevation of the route. The top value means this high or higher. */
export const FERRATA_ELE_MAX_M = 3000;

export const DEFAULT_FERRATA_LENGTH_INTERVAL: [number, number] = [
  0,
  FERRATA_LENGTH_MAX_M,
];
export const DEFAULT_FERRATA_SPAN_INTERVAL: [number, number] = [
  0,
  FERRATA_SPAN_MAX_M,
];
export const DEFAULT_FERRATA_ELE_INTERVAL: [number, number] = [
  0,
  FERRATA_ELE_MAX_M,
];

export type FerrataMeasure = {
  lengthM: number;
  spanM: number;
  /** Metres above sea level. Missing when OpenStreetMap has no line for it. */
  eleM: number | null;
};

const MEASURES: Record<string, FerrataMeasure> = {};
for (const [id, value] of Object.entries(raw as Record<string, number[]>)) {
  const [lengthM, spanM, eleM] = value;
  MEASURES[id] = {
    lengthM,
    spanM,
    eleM: eleM >= 0 ? eleM : null,
  };
}

export const getFerrataMeasure = (osmId: number): FerrataMeasure | undefined =>
  MEASURES[String(osmId)];

/** A value at `openMax` matches everything at least that large. */
export const inOpenRange = (
  value: number,
  min: number,
  max: number,
  openMax: number,
) => value >= min && (max >= openMax || value <= max);

type MeasureFilter = {
  lengthInterval: [number, number];
  spanInterval: [number, number];
  eleInterval: [number, number];
  lengthDefault: boolean;
  spanDefault: boolean;
  eleDefault: boolean;
};

/**
 * Routes without a measured line stay visible. A via ferrata split into
 * several OpenStreetMap ways uses the length of the whole route.
 */
export const matchesFerrataMeasures = (
  measure: FerrataMeasure | undefined,
  filter: MeasureFilter,
): boolean => {
  if (filter.lengthDefault && filter.spanDefault && filter.eleDefault) {
    return true;
  }
  if (!measure) return true;
  if (
    !filter.lengthDefault &&
    !inOpenRange(
      measure.lengthM,
      filter.lengthInterval[0],
      filter.lengthInterval[1],
      FERRATA_LENGTH_MAX_M,
    )
  ) {
    return false;
  }
  if (
    !filter.spanDefault &&
    !inOpenRange(
      measure.spanM,
      filter.spanInterval[0],
      filter.spanInterval[1],
      FERRATA_SPAN_MAX_M,
    )
  ) {
    return false;
  }
  if (!filter.eleDefault && measure.eleM != null) {
    return inOpenRange(
      measure.eleM,
      filter.eleInterval[0],
      filter.eleInterval[1],
      FERRATA_ELE_MAX_M,
    );
  }
  return true;
};
