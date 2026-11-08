import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t } from '../../../services/intl';
import { ProfileSection } from '../ProfileSection';
import { ProgressionPoint } from './chartData';
import {
  AXIS_TICK_STYLE,
  ChartEmpty,
  ChartTooltipBox,
  formatMonthKey,
  monthAxisLabel,
  monthAxisTicks,
  useChartColors,
} from './chartTheme';

const MAX_Y_TICKS = 6;

/** Y ticks only at grades the line actually reaches, thinned to ~6. */
const gradeTicks = (indices: number[]) => {
  const unique = [...new Set(indices)].sort((a, b) => a - b);
  if (unique.length <= MAX_Y_TICKS) return unique;
  const step = (unique.length - 1) / (MAX_Y_TICKS - 1);
  return [
    ...new Set(
      Array.from(
        { length: MAX_Y_TICKS },
        (_, i) => unique[Math.round(i * step)],
      ),
    ),
  ];
};

const ProgressionTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ProgressionPoint }[];
}) => {
  const point = payload?.[0]?.payload;
  if (!active || !point?.grade) return null;
  return (
    <ChartTooltipBox>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {formatMonthKey(point.key)}
      </Typography>
      <Box sx={{ fontWeight: 700 }}>
        {point.grade}
        {point.route ? (
          <Box component="span" sx={{ fontWeight: 400 }}>
            {' · '}
            {point.route}
          </Box>
        ) : null}
      </Box>
    </ChartTooltipBox>
  );
};

export const GradeProgressionChart = ({
  data,
}: {
  data: ProgressionPoint[];
}) => {
  const colors = useChartColors();
  const reached = data.filter((p) => p.gradeIndex != null);
  const labels = new Map(reached.map((p) => [p.gradeIndex, p.grade]));
  const ticks = gradeTicks(reached.map((p) => p.gradeIndex));
  const long = data.length > 14;

  return (
    <ProfileSection title={t('user_profile.charts.progression')}>
      <Typography
        variant="caption"
        component="p"
        sx={{ color: 'text.secondary', mt: -0.5, mb: 1 }}
      >
        {t('user_profile.charts.progression_note')}
      </Typography>
      {reached.length === 0 ? (
        <ChartEmpty />
      ) : (
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="key"
                ticks={monthAxisTicks(data.map((p) => p.key))}
                tickFormatter={(key) => monthAxisLabel(key, long)}
                tick={{ ...AXIS_TICK_STYLE, fill: colors.axisText }}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis
                type="number"
                domain={[ticks[0] - 1, ticks[ticks.length - 1] + 1]}
                ticks={ticks}
                tickFormatter={(i) => labels.get(i) ?? ''}
                tick={{ ...AXIS_TICK_STYLE, fill: colors.axisText }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={<ProgressionTooltip />}
                cursor={{ stroke: colors.grid }}
              />
              <Line
                type="linear"
                dataKey="gradeIndex"
                stroke={colors.mark}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                connectNulls
                dot={{
                  r: 4,
                  fill: colors.mark,
                  stroke: colors.surface,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: colors.mark,
                  stroke: colors.surface,
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </ProfileSection>
  );
};
