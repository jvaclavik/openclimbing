import { Chip, Stack } from '@mui/material';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { FilterCard, FilterSectionLabel, filterChipSx } from './filterUi';

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
    <FilterCard>
      <FilterSectionLabel>Land</FilterSectionLabel>
      <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
        {COUNTRIES.map(([code, label]) => {
          const selected = ferrataCountries.includes(code);
          return (
            <Chip
              key={code}
              component="button"
              type="button"
              label={label}
              size="small"
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              aria-pressed={selected}
              onClick={() => toggle(code)}
              sx={(theme) => filterChipSx(theme, !selected)}
            />
          );
        })}
      </Stack>
    </FilterCard>
  );
};
