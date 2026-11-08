import { Slider, Stack, Typography } from '@mui/material';
import React from 'react';
import { t } from '../../../../services/intl';
import { TranslationId } from '../../../../services/types';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { Interval } from '../../../utils/userSettings/getClimbingFilter';
import {
  FERRATA_ELE_MAX_M,
  FERRATA_LENGTH_MAX_M,
  FERRATA_SPAN_MAX_M,
} from '../../../../services/tagging/ferrataMeasures';
import { FilterCard, FilterSectionLabel, filterSliderSx } from './filterUi';

const formatMetres = (metres: number, openMax: number) =>
  metres >= openMax ? `${openMax}+ m` : `${metres} m`;

type RowProps = {
  label: TranslationId;
  interval: Interval;
  max: number;
  step: number;
  onChange: (next: Interval) => void;
};

const MeasureSlider = ({ label, interval, max, step, onChange }: RowProps) => (
  <Stack>
    <Stack
      direction="row"
      sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
    >
      <FilterSectionLabel $flush>{t(label)}</FilterSectionLabel>
      <strong>
        {formatMetres(interval[0], max)} – {formatMetres(interval[1], max)}
      </strong>
    </Stack>
    <Slider
      value={interval}
      onChange={(_event, next) => onChange(next as Interval)}
      min={0}
      max={max}
      step={step}
      valueLabelDisplay="auto"
      valueLabelFormat={(value) => formatMetres(value, max)}
      sx={filterSliderSx}
    />
  </Stack>
);

export const FerrataMeasureFilters = () => {
  const {
    ferrataLengthInterval,
    setFerrataLengthInterval,
    ferrataSpanInterval,
    setFerrataSpanInterval,
    ferrataEleInterval,
    setFerrataEleInterval,
  } = useUserSettingsContext().climbingFilter;

  return (
    <FilterCard>
      <Stack sx={{ gap: 1.5 }}>
        <MeasureSlider
          label="crag_filter.ferrata_length"
          interval={ferrataLengthInterval}
          max={FERRATA_LENGTH_MAX_M}
          step={25}
          onChange={setFerrataLengthInterval}
        />
        <MeasureSlider
          label="crag_filter.ferrata_span"
          interval={ferrataSpanInterval}
          max={FERRATA_SPAN_MAX_M}
          step={25}
          onChange={setFerrataSpanInterval}
        />
        <MeasureSlider
          label="crag_filter.ferrata_height"
          interval={ferrataEleInterval}
          max={FERRATA_ELE_MAX_M}
          step={50}
          onChange={setFerrataEleInterval}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('crag_filter.ferrata_note')}
        </Typography>
      </Stack>
    </FilterCard>
  );
};
