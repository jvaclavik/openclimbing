import { Box, Button, Typography } from '@mui/material';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

const COUNTRIES = [
  ['at', 'Österreich'],
  ['de', 'Deutschland'],
  ['it', 'Italien'],
  ['ch', 'Schweiz'],
  ['fr', 'Frankreich'],
  ['si', 'Slowenien'],
  ['es', 'Spanien'],
  ['hr', 'Kroatien'],
  ['cz', 'Tschechien'],
  ['sk', 'Slowakei'],
  ['hu', 'Ungarn'],
  ['no', 'Norwegen'],
] as const;

export const FerrataCountryFilter = () => {
  const { ferrataCountries, setFerrataCountries } =
    useUserSettingsContext().climbingFilter;

  const toggle = (code: string) =>
    setFerrataCountries(
      ferrataCountries.includes(code)
        ? ferrataCountries.filter((value) => value !== code)
        : [...ferrataCountries, code],
    );

  return (
    <Box component="fieldset" sx={{ m: 0, p: 1, minWidth: 0, border: 0 }}>
      <Typography component="legend" variant="subtitle2">
        Land
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {COUNTRIES.map(([code, label]) => {
          const selected = ferrataCountries.includes(code);
          return (
            <Button
              key={code}
              aria-pressed={selected}
              variant={selected ? 'contained' : 'outlined'}
              sx={{ minHeight: 40, px: 1.25, textTransform: 'none' }}
              onClick={() => toggle(code)}
            >
              {label}
            </Button>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Ohne Auswahl siehst du alle Länder. Länge und Gehzeit stehen in der
        Beschreibung des Steigs, nicht als eigener Filter.
      </Typography>
    </Box>
  );
};
