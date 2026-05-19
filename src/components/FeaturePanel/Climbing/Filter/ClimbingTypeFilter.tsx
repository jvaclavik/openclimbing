import React from 'react';
import { Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import { t } from '../../../../services/intl';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';

export const ClimbingTypeFilter = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { poiTypes, setPoiTypes } = climbingFilter;

  const toggle =
    (key: keyof typeof poiTypes) =>
    (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setPoiTypes({ ...poiTypes, [key]: checked });
    };

  return (
    <Stack gap={1} ml={2} mr={2} mt={1} sx={{ paddingBottom: 2 }}>
      <div>{t('crag_filter.type')}</div>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox checked={poiTypes.rock} onChange={toggle('rock')} />
          }
          label={t('crag_filter.type_rock')}
        />
        <FormControlLabel
          control={
            <Checkbox checked={poiTypes.ferrata} onChange={toggle('ferrata')} />
          }
          label={t('crag_filter.type_ferrata')}
        />
        <FormControlLabel
          control={<Checkbox checked={poiTypes.gym} onChange={toggle('gym')} />}
          label={t('crag_filter.type_gym')}
        />
      </FormGroup>
    </Stack>
  );
};
