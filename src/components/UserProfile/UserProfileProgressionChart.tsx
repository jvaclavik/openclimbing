import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t } from '../../services/intl';
import { GRADE_TABLE } from '../../services/tagging/climbing/gradeData';
import { GradeSystem } from '../../services/tagging/climbing/gradeSystems';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';
import type { ProgressionRow } from './userProfileCareerAggregates';
import {
  ProfileChartSection,
  monthKeyToYearLabel,
  useRechartsAxisTheme,
  useRechartsTooltipTheme,
  yearTicksFromMonthKeys,
} from './userProfileChartTheme';

const Y_TICK_COUNT = 5;

function gradeLabelForRowIndex(
  gradeSystem: GradeSystem,
  rowIndex: number,
): string {
  const table = GRADE_TABLE[gradeSystem];
  if (!table) {
    return '';
  }
  const i = Math.round(rowIndex);
  if (i < 0 || i >= table.length) {
    return '';
  }
  return table[i];
}

function valueBounds(series: ProgressionRow[]): [number, number] | null {
  const values = series.flatMap((row) =>
    [row.best, row.topAvg].filter((v): v is number => v != null),
  );
  if (values.length === 0) {
    return null;
  }
  return [Math.min(...values), Math.max(...values)];
}

/** Celočíselné značky osy Y, ať se stupně neopakují ani nepřeskakují. */
function yTicks(min: number, max: number): number[] {
  const from = Math.max(0, Math.floor(min));
  const to = Math.ceil(max);
  const span = Math.max(1, to - from);
  const step = Math.max(1, Math.round(span / (Y_TICK_COUNT - 1)));
  const out: number[] = [];
  for (let v = from; v <= to; v += step) {
    out.push(v);
  }
  if (out[out.length - 1] !== to) {
    out.push(to);
  }
  return out;
}

export function UserProfileProgressionChart({
  series,
}: {
  series: ProgressionRow[];
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  const { gradeSystem } = useUserSettingsContext();
  const bounds = valueBounds(series);
  if (series.length === 0 || !bounds) {
    return null;
  }
  const [min, max] = bounds;
  const ticks = yTicks(min - 1, max + 1);
  const gradeTick = (value: number) =>
    gradeLabelForRowIndex(gradeSystem, value);
  return (
    <ProfileChartSection
      title={t('user_profile.chart_progression')}
      note={t('user_profile.chart_progression_note')}
      height={280}
    >
      <LineChart
        data={series}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
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
          domain={[ticks[0], ticks[ticks.length - 1]]}
          ticks={ticks}
          tickFormatter={gradeTick}
          width={56}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <RechartsTooltip
          {...tt}
          labelFormatter={(label) => String(label)}
          formatter={(value: any, name: any) => [
            gradeLabelForRowIndex(gradeSystem, Number(value)) || value,
            name,
          ]}
        />
        <Legend wrapperStyle={ax.legendWrapperStyle} />
        <Line
          type="monotone"
          dataKey="best"
          name={t('user_profile.chart_progression_best')}
          stroke={theme.palette.secondary.main}
          strokeDasharray="4 3"
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="topAvg"
          name={t('user_profile.chart_progression_top_avg')}
          stroke={theme.palette.primary.main}
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ProfileChartSection>
  );
}
