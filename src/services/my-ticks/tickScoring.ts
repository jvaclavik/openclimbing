import { TickStyle } from '../../components/FeaturePanel/Climbing/types';
import { ClimbingTick } from '../../types';
import { FeatureTags } from '../types';
import { GRADE_TABLE } from '../tagging/climbing/gradeData';
import { GradeSystem } from '../tagging/climbing/gradeSystems';
import {
  findGradeTableRowIndexForGradeText,
  findOrConvertRouteGrade,
  getDifficulties,
  sanitizeApproximationSymbol,
} from '../tagging/climbing/routeGrade';

export type TickScore = {
  points: number;
  gradeRowIndex: number | null;
  /** Body za obtížnost před násobením stylem (`(index+1)*2` nebo výchozí při neznámé klasifikaci). */
  gradeBase: number;
  multiplier: number;
};

/** Násobiče podle způsobu přelezu (null = styl nevybrán). */
export const TICK_STYLE_MULTIPLIERS: Record<
  Exclude<TickStyle, null>,
  number
> = {
  OS: 1.25,
  FL: 1.15,
  RP: 1,
  PP: 1,
  RK: 0.65,
  AF: 0.95,
  TR: 0.45,
  FS: 1.1,
  PJ: 0,
};

export const TICK_STYLE_MULTIPLIER_DEFAULT_NO_STYLE = 0.8;

/**
 * Řádek ve sdílené tabulce stupňů (stejná logika jako u `convertGrade` v routeGrade).
 */
/** Základní body za řádek tabulky stupňů (stejný vzorec jako sloupec v climbing grades table). */
export function gradeBasePointsFromRowIndex(rowIndex: number): number {
  return (rowIndex + 1) * 2;
}

export function findGradeRowIndex(
  system: GradeSystem,
  gradeValue: string,
): number | null {
  if (!gradeValue || gradeValue === '?') {
    return null;
  }
  const table = GRADE_TABLE[system];
  if (!table) {
    return null;
  }
  const v = sanitizeApproximationSymbol(gradeValue.trim());
  const i = table.findIndex((item) => item.startsWith(v));
  return i >= 0 ? i : null;
}

function getStyleMultiplier(style: string | null): number {
  if (style === null || style === undefined) {
    return TICK_STYLE_MULTIPLIER_DEFAULT_NO_STYLE;
  }
  if (style === 'PJ') {
    return TICK_STYLE_MULTIPLIERS.PJ;
  }
  return TICK_STYLE_MULTIPLIERS[style as Exclude<TickStyle, null>] ?? 0.85;
}

/**
 * Body za jeden tick: základ z řádku tabulky obtížností ve zvoleném systému × násobič stylu.
 * Projekt (PJ) = 0 bodů. Neznámá klasifikace = malý základ (4) × násobič.
 */
export function computeTickScore(
  tags: FeatureTags | undefined,
  tick: ClimbingTick,
  gradeSystem: GradeSystem,
): TickScore {
  const style = tick.style as TickStyle | null;
  const mult = getStyleMultiplier(style);
  if (style === 'PJ') {
    return {
      points: 0,
      gradeRowIndex: null,
      gradeBase: 0,
      multiplier: mult,
    };
  }

  const difficulties = getDifficulties(tags);
  const { routeDifficulty } = findOrConvertRouteGrade(
    difficulties ?? [],
    gradeSystem,
  );

  let idx: number | null = null;
  if (routeDifficulty?.grade && routeDifficulty.grade !== '?') {
    idx = findGradeRowIndex(gradeSystem, routeDifficulty.grade);
  }
  if (idx === null && tick.myGrade?.trim()) {
    idx = findGradeRowIndex(gradeSystem, tick.myGrade.trim());
  }

  const gradeBase = idx !== null ? gradeBasePointsFromRowIndex(idx) : 4;
  const points = Math.round(gradeBase * mult);

  return {
    points,
    gradeRowIndex: idx,
    gradeBase,
    multiplier: mult,
  };
}

/**
 * Body za tick pro agregace (žebříček): řádek tabulky z textu obtížnosti,
 * stejný základ jako u převodu přes spojenou tabulku stupňů.
 */
export function computeTickPointsForLeaderboard(tick: {
  style: string | null;
  routeGradeTxt?: string | null;
  myGrade?: string | null;
}): number {
  const style = tick.style as TickStyle | null;
  if (style === 'PJ') {
    return 0;
  }
  const mult = getStyleMultiplier(style);
  const gradeTxt = tick.routeGradeTxt?.trim() || tick.myGrade?.trim() || '';
  const rowIdx = gradeTxt ? findGradeTableRowIndexForGradeText(gradeTxt) : null;
  const gradeBase = rowIdx != null ? gradeBasePointsFromRowIndex(rowIdx) : 4;
  return Math.round(gradeBase * mult);
}
