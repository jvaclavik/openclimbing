import { Box, Button, Typography } from '@mui/material';
import {
  ALL_FERRATA_GRADES,
  FERRATA_GRADES,
  FerrataGrade,
} from '../../../../services/tagging/ferrataGradeFilter';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

const PRESETS: { label: string; grades: FerrataGrade[] }[] = [
  { label: 'Leicht', grades: ['A', 'B'] },
  { label: 'Mittel', grades: ['C'] },
  { label: 'Schwer', grades: ['D', 'E', 'F'] },
  { label: 'Alle', grades: ALL_FERRATA_GRADES },
];

export const FerrataGradeFilter = () => {
  const { ferrataGrades, setFerrataGrades } =
    useUserSettingsContext().climbingFilter;

  return (
    <Box component="fieldset" sx={{ m: 0, p: 1, minWidth: 0, border: 0 }}>
      <Typography component="legend" variant="subtitle2">
        Klettersteiggrade
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            size="small"
            variant="text"
            sx={{ minHeight: 36, textTransform: 'none' }}
            onClick={() => setFerrataGrades(preset.grades)}
          >
            {preset.label}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {ALL_FERRATA_GRADES.map((grade) => {
          const selected = ferrataGrades.includes(grade);
          return (
            <Button
              key={grade}
              aria-pressed={selected}
              variant={selected ? 'contained' : 'outlined'}
              sx={{ minWidth: 42, minHeight: 44, px: 1 }}
              onClick={() =>
                setFerrataGrades(
                  selected
                    ? ferrataGrades.filter((value) => value !== grade)
                    : [...ferrataGrades, grade],
                )
              }
            >
              {grade === 'unknown' ? 'Unbekannt' : grade}
            </Button>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary">
        A ist der leichteste Grad, F der schwerste. {FERRATA_GRADES[0]} bis{' '}
        {FERRATA_GRADES[5]} könnt ihr einzeln an- und abwählen.
      </Typography>
    </Box>
  );
};
