/**
 * Via ferrata grading conversion.
 *
 * OSM uses the Schall scale (numeric 1–6) in the `via_ferrata_scale` tag.
 * This module converts it to the French and German/Hüsler scales.
 *
 * @see https://wiki.openstreetmap.org/wiki/Key:via_ferrata_scale
 */

export interface ViaFerrataGrades {
  french: string;
  german: string;
}

// Mapping from OSM via_ferrata_scale value to French and German grades
const GRADE_MAP: Record<string, ViaFerrataGrades> = {
  '0': { french: 'F', german: 'K1' },
  '1': { french: 'PD', german: 'K2' },
  '2': { french: 'AD', german: 'K3' },
  '3': { french: 'D', german: 'K4' },
  '4': { french: 'TD', german: 'K5' },
  '5': { french: 'ED', german: 'K6' },
};

// Colors for via ferrata difficulty levels
export const VIA_FERRATA_SCALE_COLORS: Record<string, string> = {
  '0': '#4caf50',
  '1': '#2196f3',
  '2': '#ff9800',
  '3': '#f44336',
  '4': '#9c27b0',
  '5': '#212121',
};

/**
 * Returns the French and German grade equivalents for a given via_ferrata_scale value.
 * Returns undefined if the value is not a valid scale number.
 */
export const getViaFerrataGrades = (
  value: string,
): ViaFerrataGrades | undefined => {
  return GRADE_MAP[value];
};
