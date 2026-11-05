/**
 * Via ferrata grading conversion.
 *
 * OSM uses the Schall scale (numeric 0–6) in the `via_ferrata_scale` tag.
 * This module converts it to the French and German/Hüsler scales.
 *
 * @see https://wiki.openstreetmap.org/wiki/Key:via_ferrata_scale
 */

import { gradeColors } from './climbing/gradeData';

export interface ViaFerrataGrades {
  french: string;
  german?: string;
  /** Hüsler letter (A–F). Scale 0 has no German letter. */
  huesler?: string;
}

// OSM Schall number → French grade, Schall "K" label, and Hüsler letter.
// @see https://wiki.openstreetmap.org/wiki/Key:via_ferrata_scale
const GRADE_MAP: Record<string, ViaFerrataGrades> = {
  '0': { french: 'F' },
  '1': { french: 'PD', german: 'K1', huesler: 'A' },
  '2': { french: 'AD', german: 'K2', huesler: 'B' },
  '3': { french: 'D', german: 'K3', huesler: 'C' },
  '4': { french: 'TD', german: 'K4', huesler: 'D' },
  '5': { french: 'ED', german: 'K5', huesler: 'E' },
  '6': { french: 'ABO', german: 'K6', huesler: 'F' },
};

/** Copper cable on the map, distinct from red crags and blue areas. */
export const VIA_FERRATA_LINE_COLOR = '#c56a12';
export const VIA_FERRATA_CASING_COLOR = '#fff8ee';

export const isViaFerrataTags = (
  tags?: Record<string, string> | null,
): boolean =>
  !!tags &&
  (tags.highway === 'via_ferrata' ||
    tags.route === 'via_ferrata' ||
    tags.sport === 'via_ferrata' ||
    tags.climbing === 'via_ferrata' ||
    !!tags.via_ferrata_scale);

type GradeColor = (typeof gradeColors)['1-'];

// Same teal → lime → amber → orange → red ramp as climbing grades.
export const VIA_FERRATA_SCALE_COLORS: Record<string, GradeColor> = {
  '0': gradeColors['1-'],
  '1': gradeColors['1-'],
  '2': gradeColors['4-'],
  '3': gradeColors['6-'],
  '4': gradeColors['8-'],
  '5': gradeColors['10-'],
  '6': gradeColors['10-'],
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
    huesler: baseGrade.huesler ? `${baseGrade.huesler}${suffix}` : undefined,
  };
};

export type ViaFerrataGradeLabel = {
  /** Hüsler letter when the scale has one, otherwise the French grade. */
  letter: string;
  schall: string;
  french: string;
  german?: string;
  veryEasy: boolean;
};

const labelForScale = (value: string): ViaFerrataGradeLabel | undefined => {
  const grades = getViaFerrataGrades(value);
  if (!grades) return undefined;
  return {
    letter: grades.huesler ?? grades.french,
    schall: value,
    french: grades.french,
    german: grades.german,
    veryEasy: !grades.huesler,
  };
};

const joinRange = (a: string, b: string) => (a === b ? a : `${a}–${b}`);

/** Label for one OSM value (`3`, `2+`) or a min–max range (`2+–4`). */
export const describeViaFerrataScale = (
  value: string,
): ViaFerrataGradeLabel | undefined => {
  if (!value.includes('–')) return labelForScale(value);

  const [min, max] = value.split('–');
  const easy = labelForScale(min);
  const hard = labelForScale(max);
  if (!easy || !hard) return undefined;

  return {
    letter: joinRange(easy.letter, hard.letter),
    schall: value,
    french: joinRange(easy.french, hard.french),
    german:
      easy.german && hard.german
        ? joinRange(easy.german, hard.german)
        : easy.german || hard.german,
    veryEasy: easy.veryEasy && hard.veryEasy,
  };
};

/**
 * Own `via_ferrata_scale`, or the min–max of member ways on a ferrata relation
 * that only stores the grade on its sections.
 */
export const resolveViaFerrataScale = (
  tags: Record<string, string> | undefined,
  memberScales: Array<string | undefined> = [],
): string | null => {
  const own = tags?.via_ferrata_scale?.trim();
  if (own) return own;
  if (!isViaFerrataTags(tags)) return null;

  return formatViaFerrataScaleRange(
    memberScales
      .map((scale) => scale?.trim())
      .filter((scale): scale is string => !!scale),
  );
};

export const getViaFerrataScaleColor = (
  value: string,
  mode: 'light' | 'dark' = 'light',
): string | undefined => {
  const match = value.match(FERRATA_SCALE_REGEX);
  if (!match) {
    return undefined;
  }
  const [, baseScale] = match;
  return VIA_FERRATA_SCALE_COLORS[baseScale]?.[mode];
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
  mode: 'light' | 'dark' = 'light',
): string | undefined => {
  const max = value.includes('–') ? value.slice(value.indexOf('–') + 1) : value;
  return getViaFerrataScaleColor(max, mode);
};
