import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t, tPlural } from '../../../services/intl';
import { ProfileSection } from '../ProfileSection';
import {
  AXIS_TICK_STYLE,
  ChartEmpty,
  ChartTooltipBox,
  formatMonthKey,
  monthAxisLabel,
  monthAxisTicks,
  useChartColors,
} from './chartTheme';

type Point = { key: string; sends: number };

const SendsTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <ChartTooltipBox>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {formatMonthKey(point.key)}
      </Typography>
      <Box sx={{ fontWeight: 700 }}>
        {tPlural('user_profile.unit.sends', point.sends)}
      </Box>
    </ChartTooltipBox>
  );
};

export const SendsByMonthChart = ({ data }: { data: Point[] }) => {
  const colors = useChartColors();
  const long = data.length > 14;
  const hasData = data.some((p) => p.sends > 0);

  return (
    <ProfileSection title={t('user_profile.charts.sends_by_month')}>
      {!hasData ? (
        <ChartEmpty />
      ) : (
        <Box sx={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                allowDecimals={false}
                tick={{ ...AXIS_TICK_STYLE, fill: colors.axisText }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={<SendsTooltip />}
                cursor={{ fill: colors.track }}
              />
              <Bar
                dataKey="sends"
                fill={colors.mark}
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </ProfileSection>
  );
};
