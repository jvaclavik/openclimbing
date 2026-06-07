// Curated "designer pastel" palette — medium saturation, soft but characterful.
// White stays as the neutral default; black anchors the end.
export const LIST_COLOR_PALETTE: string[] = [
  '#FFFFFF', // white (default)
  '#F87171', // coral
  '#FB923C', // peach
  '#FBBF24', // amber
  '#A3E635', // chartreuse
  '#4ADE80', // mint
  '#2DD4BF', // teal
  '#38BDF8', // sky
  '#818CF8', // periwinkle
  '#A78BFA', // lavender
  '#E879F9', // orchid
  '#F472B6', // rose
  '#111827', // black
];

export const DEFAULT_LIST_COLOR: string = '#FFFFFF';

const isValidHex = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());

export const sanitizeListColor = (value: unknown): string =>
  isValidHex(value) ? (value as string).trim() : DEFAULT_LIST_COLOR;

/**
 * Pick the first palette color that isn't already used by any of the given
 * lists. If every palette color is used at least once, cycle back to the
 * least-used one (deterministic — first in palette wins on ties).
 */
export const pickNextListColor = (usedColors: string[]): string => {
  const counts = new Map<string, number>(LIST_COLOR_PALETTE.map((c) => [c, 0]));
  for (const c of usedColors) {
    if (counts.has(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = LIST_COLOR_PALETTE[0];
  let bestCount = counts.get(best) ?? 0;
  for (const c of LIST_COLOR_PALETTE) {
    const n = counts.get(c) ?? 0;
    if (n < bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
};
