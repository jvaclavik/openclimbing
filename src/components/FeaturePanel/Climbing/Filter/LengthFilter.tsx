import { Slider, Stack } from '@mui/material';
import { t } from '../../../../services/intl';
import React from 'react';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { Interval } from '../../../utils/userSettings/getClimbingFilter';
import { LENGTH_FILTER_MAX_M } from '../../../../services/tagging/climbing/parseClimbingLength';
import { FilterSectionLabel, filterSliderSx } from './filterUi';

const formatBound = (meters: number) =>
  meters >= LENGTH_FILTER_MAX_M ? `${LENGTH_FILTER_MAX_M}+ m` : `${meters} m`;

export const LengthFilter = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { lengthInterval, setLengthInterval, lengthFilterMax } = climbingFilter;

  const onChange = (_event: Event, newValue: number | number[]) => {
    setLengthInterval(newValue as Interval);
  };

  return (
    <Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <FilterSectionLabel $flush>
          {t('crag_filter.length')}
        </FilterSectionLabel>
        <strong>
          {formatBound(lengthInterval[0])} – {formatBound(lengthInterval[1])}
        </strong>
      </Stack>
      <Slider
        value={lengthInterval}
        onChange={onChange}
        min={0}
        max={lengthFilterMax}
        step={5}
        valueLabelDisplay="auto"
        valueLabelFormat={formatBound}
        sx={filterSliderSx}
      />
    </Stack>
  );
};
