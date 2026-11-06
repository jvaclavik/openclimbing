import { Box, Button, Typography } from '@mui/material';
import { ALL_FERRATA_GRADES } from '../../../../services/tagging/ferrataGradeFilter';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

export const FerrataGradeFilter = () => {
  const { ferrataGrades, setFerrataGrades } =
    useUserSettingsContext().climbingFilter;

  return (
    <Box component="fieldset" sx={{ m: 0, p: 1, minWidth: 0, border: 0 }}>
      <Typography component="legend" variant="subtitle2">
        Klettersteiggrade
      </Typography>
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
    </Box>
  );
};
