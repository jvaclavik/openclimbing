import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t } from '../../services/intl';
import type { CumulativeRow } from './userProfileCareerAggregates';
import {
  ProfileChartSection,
  monthKeyToYearLabel,
  useRechartsAxisTheme,
  useRechartsTooltipTheme,
  yearTicksFromMonthKeys,
} from './userProfileChartTheme';

export function UserProfileCumulativeChart({
  series,
}: {
  series: CumulativeRow[];
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  if (series.length === 0) {
    return null;
  }
  const last = series[series.length - 1];
  if (last.ascents === 0 && last.points === 0) {
    return null;
  }
  return (
    <ProfileChartSection
      title={t('user_profile.chart_cumulative')}
      note={t('user_profile.chart_all_time_note')}
      height={280}
    >
      <ComposedChart
        data={series}
        margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={ax.gridStroke} />
        <XAxis
          dataKey="key"
          ticks={yearTicksFromMonthKeys(series.map((row) => row.key))}
          tickFormatter={monthKeyToYearLabel}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <YAxis
          yAxisId="ascents"
          allowDecimals={false}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <YAxis
          yAxisId="points"
          orientation="right"
          allowDecimals={false}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <RechartsTooltip {...tt} />
        <Legend wrapperStyle={ax.legendWrapperStyle} />
        <Area
          yAxisId="ascents"
          type="monotone"
          dataKey="ascents"
          name={t('user_profile.chart_cumulative_ascents')}
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          fill={alpha(theme.palette.primary.main, 0.18)}
        />
        <Line
          yAxisId="points"
          type="monotone"
          dataKey="points"
          name={t('user_profile.chart_cumulative_points')}
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ProfileChartSection>
  );
}
