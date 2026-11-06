export const FERRATA_GRADES = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
export type FerrataGrade = (typeof FERRATA_GRADES)[number] | 'unknown';
export const ALL_FERRATA_GRADES: FerrataGrade[] = [
  ...FERRATA_GRADES,
  'unknown',
];

const gradeIndex = (grade: string) => {
  const value = grade.toUpperCase().replace(/[+-]$/, '');
  if (/^[1-6]$/.test(value)) return Number(value) - 1;
  return FERRATA_GRADES.findIndex((letter) => letter === value);
};

/** A split grade matches either side; a range includes its intermediate grades. */
export const matchesFerrataGrade = (
  scale: string | null | undefined,
  selected: readonly FerrataGrade[],
): boolean => {
  const match = scale
    ?.trim()
    .match(/^([A-F1-6][+-]?)(?:\s*([/–-])\s*([A-F1-6][+-]?))?$/i);
  if (!match) return selected.includes('unknown');

  const first = gradeIndex(match[1]);
  const last = match[3] ? gradeIndex(match[3]) : first;
  if (match[2] === '/') {
    return (
      selected.includes(FERRATA_GRADES[first]) ||
      selected.includes(FERRATA_GRADES[last])
    );
  }
  return FERRATA_GRADES.slice(
    Math.min(first, last),
    Math.max(first, last) + 1,
  ).some((grade) => selected.includes(grade));
};
