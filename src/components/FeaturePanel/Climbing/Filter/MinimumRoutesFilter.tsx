import { Slider, Stack } from '@mui/material';
import { t } from '../../../../services/intl';
import React from 'react';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { FilterCard, FilterSectionLabel, filterSliderSx } from './filterUi';

export const MinimumRoutesFilter = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { minimumRoutes, setMinimumRoutes } = climbingFilter;

  const onChange = (_event: Event, newValue: number) => {
    setMinimumRoutes(newValue);
  };

  return (
    <FilterCard>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <FilterSectionLabel $flush>
          {t('crag_filter.show_at_least')}
        </FilterSectionLabel>
        <strong>
          {minimumRoutes} {t('crag_filter.routes')}
        </strong>
      </Stack>
      <Slider
        value={minimumRoutes}
        onChange={onChange}
        min={1}
        max={80}
        sx={filterSliderSx}
      />
    </FilterCard>
  );
};
