/**
 * Via ferrata grading conversion.
 *
 * OSM uses the Schall scale (numeric 0–6) in the `via_ferrata_scale` tag.
 * This module converts it to the French and German/Hüsler scales.
 *
 * @see https://wiki.openstreetmap.org/wiki/Key:via_ferrata_scale
 */

export interface ViaFerrataGrades {
  french: string;
  german?: string;
}

// Mapping from OSM via_ferrata_scale value to French and German grades
const GRADE_MAP: Record<string, ViaFerrataGrades> = {
  '0': { french: 'F' },
  '1': { french: 'PD', german: 'K1' },
  '2': { french: 'AD', german: 'K2' },
  '3': { french: 'D', german: 'K3' },
  '4': { french: 'TD', german: 'K4' },
  '5': { french: 'ED', german: 'K5' },
  '6': { french: 'ABO', german: 'K6' },
};

// Colors for via ferrata difficulty levels
export const VIA_FERRATA_SCALE_COLORS: Record<string, string> = {
  '0': '#4caf50',
  '1': '#2196f3',
  '2': '#ff9800',
  '3': '#f44336',
  '4': '#9c27b0',
  '5': '#4e342e',
  '6': '#212121',
};

const FERRATA_SCALE_REGEX = /^([0-6])([+-])?$/;

/**
 * Returns the French and German grade equivalents for a given via_ferrata_scale value.
 * Returns undefined if the value is not a valid scale number.
 */
export const getViaFerrataGrades = (
  value: string,
): ViaFerrataGrades | undefined => {
  const match = value.match(FERRATA_SCALE_REGEX);
  if (!match) {
    return undefined;
  }

  const [, baseScale, suffix = ''] = match;
  const baseGrade = GRADE_MAP[baseScale];
  if (!baseGrade) {
    return undefined;
  }

  return {
    french: `${baseGrade.french}${suffix}`,
    german: baseGrade.german ? `${baseGrade.german}${suffix}` : undefined,
  };
};

export const getViaFerrataScaleColor = (value: string): string | undefined => {
  const match = value.match(FERRATA_SCALE_REGEX);
  if (!match) {
    return undefined;
  }
  const [, baseScale] = match;
  return VIA_FERRATA_SCALE_COLORS[baseScale];
};

const getViaFerrataScaleRank = (value: string): number | undefined => {
  const match = value.match(FERRATA_SCALE_REGEX);
  if (!match) return undefined;
  const [, baseScale, suffix] = match;
  return Number(baseScale) + (suffix === '+' ? 0.3 : suffix === '-' ? -0.3 : 0);
};

export const formatViaFerrataScaleRange = (values: string[]): string | null => {
  const ranked = values
    .map((value) => {
      const rank = getViaFerrataScaleRank(value);
      return rank == null ? null : { value, rank };
    })
    .filter((item): item is { value: string; rank: number } => item != null);

  if (!ranked.length) return null;

  ranked.sort((a, b) => a.rank - b.rank);
  const min = ranked[0];
  const max = ranked[ranked.length - 1];
  return min.value === max.value ? min.value : `${min.value}–${max.value}`;
};

export const getViaFerrataScaleRangeColor = (
  value: string,
): string | undefined => {
  const max = value.includes('–') ? value.slice(value.indexOf('–') + 1) : value;
  return getViaFerrataScaleColor(max);
};
