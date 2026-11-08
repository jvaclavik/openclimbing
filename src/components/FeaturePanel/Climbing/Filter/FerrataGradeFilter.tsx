import { Chip, Stack } from '@mui/material';
import {
  ALL_FERRATA_GRADES,
  FerrataGrade,
} from '../../../../services/tagging/ferrataGradeFilter';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { FilterCard, FilterSectionLabel, filterChipSx } from './filterUi';

const PRESETS: { label: string; grades: FerrataGrade[] }[] = [
  { label: 'Leicht', grades: ['A', 'B'] },
  { label: 'Mittel', grades: ['C'] },
  { label: 'Schwer', grades: ['D', 'E', 'F'] },
  { label: 'Alle', grades: ALL_FERRATA_GRADES },
];

const sameGrades = (
  left: readonly FerrataGrade[],
  right: readonly FerrataGrade[],
) =>
  left.length === right.length && left.every((grade) => right.includes(grade));

export const FerrataGradeFilter = () => {
  const { ferrataGrades, setFerrataGrades } =
    useUserSettingsContext().climbingFilter;

  return (
    <FilterCard>
      <FilterSectionLabel>Klettersteiggrad</FilterSectionLabel>
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
        {PRESETS.map((preset) => {
          const selected = sameGrades(ferrataGrades, preset.grades);
          return (
            <Chip
              key={preset.label}
              label={preset.label}
              size="small"
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => setFerrataGrades(preset.grades)}
              sx={(theme) => filterChipSx(theme, !selected)}
            />
          );
        })}
      </Stack>
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
        {ALL_FERRATA_GRADES.map((grade) => {
          const selected = ferrataGrades.includes(grade);
          return (
            <Chip
              key={grade}
              component="button"
              type="button"
              label={grade === 'unknown' ? 'Unbekannt' : grade}
              size="small"
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              aria-pressed={selected}
              onClick={() =>
                setFerrataGrades(
                  selected
                    ? ferrataGrades.filter((value) => value !== grade)
                    : [...ferrataGrades, grade],
                )
              }
              sx={(theme) => filterChipSx(theme, !selected)}
            />
          );
        })}
      </Stack>
    </FilterCard>
  );
};
