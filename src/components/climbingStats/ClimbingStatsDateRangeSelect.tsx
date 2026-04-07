import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { t } from '../../services/intl';

type Props = {
  value: string;
  onChange: (e: SelectChangeEvent<string>) => void;
  years: number[];
  labelId?: string;
};

export function ClimbingStatsDateRangeSelect({
  value,
  onChange,
  years,
  labelId = 'climbing-stats-period-label',
}: Props) {
  return (
    <FormControl size="small" sx={{ maxWidth: 280 }}>
      <InputLabel id={labelId}>{t('user_profile.period_label')}</InputLabel>
      <Select
        labelId={labelId}
        value={value}
        label={t('user_profile.period_label')}
        onChange={onChange}
      >
        <MenuItem value="rolling365">
          {t('user_profile.period_last_365')}
        </MenuItem>
        <MenuItem value="all">{t('user_profile.period_all')}</MenuItem>
        {years.map((y) => (
          <MenuItem key={y} value={`year:${y}`}>
            {t('user_profile.period_year', { year: y })}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
