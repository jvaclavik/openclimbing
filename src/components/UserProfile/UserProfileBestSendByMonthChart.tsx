import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t } from '../../services/intl';

type BestSendDatum = { key: string; gradeLabel: string; rowIndex: number };

function parseMonthKey(key: string): { year: string; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return { year: '', month: 0 };
  return { year: m[1], month: parseInt(m[2], 10) };
}

function buildShowYearMap(keys: string[]) {
  const showYear = new Map<string, boolean>();
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const { year, month } = parseMonthKey(k);
    const prevYear = i > 0 ? parseMonthKey(keys[i - 1]).year : '';
    showYear.set(k, i === 0 || (month === 1 && prevYear !== year));
  }
  return showYear;
}

function buildYearBands(keys: string[]) {
  const bands: Array<{ year: string; x1: string; x2: string; alt: boolean }> =
    [];
  let curYear = '';
  let startKey = '';
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const y = parseMonthKey(k).year;
    if (!y) continue;
    if (curYear === '') {
      curYear = y;
      startKey = k;
      continue;
    }
    if (y !== curYear) {
      const yearNum = parseInt(curYear, 10);
      bands.push({
        year: curYear,
        x1: startKey,
        x2: keys[i - 1],
        alt: Number.isFinite(yearNum) ? yearNum % 2 === 0 : false,
      });
      curYear = y;
      startKey = k;
    }
  }
  if (curYear && startKey) {
    const yearNum = parseInt(curYear, 10);
    bands.push({
      year: curYear,
      x1: startKey,
      x2: keys[keys.length - 1],
      alt: Number.isFinite(yearNum) ? yearNum % 2 === 0 : false,
    });
  }
  return bands;
}

function monthYearTickRenderer(showYear: Map<string, boolean>) {
  const Tick = (props: any) => {
    const value = String(props.payload.value);
    const { year, month } = parseMonthKey(value);
    const show = showYear.get(value);
    return (
      <g transform={`translate(${props.x},${props.y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fill="var(--mui-palette-text-secondary)"
          fontSize={10}
        >
          {month || ''}
        </text>
        <text
          x={0}
          y={0}
          dy={24}
          textAnchor="middle"
          fill="var(--mui-palette-text-secondary)"
          fontSize={9}
        >
          {show ? year : ''}
        </text>
      </g>
    );
  };
  Tick.displayName = 'MonthYearTick';
  return Tick;
}

function bestSendTooltipFormatter(value: any, _name: any, props: any) {
  const grade = props?.payload?.gradeLabel;
  return [grade || value, t('user_profile.chart_best_send_month')];
}

export function UserProfileBestSendByMonthChart({
  series,
  maxRowIndex,
}: {
  series: BestSendDatum[];
  maxRowIndex: number;
}) {
  const theme = useTheme();
  if (series.length === 0) return null;
  const keys = series.map((s) => s.key);
  const showYear = buildShowYearMap(keys);
  const yearBands = buildYearBands(keys);
  const data = series.map((s) => ({
    key: s.key,
    value: Math.max(0, (s.rowIndex ?? -1) + 1),
    gradeLabel: s.gradeLabel,
  }));
  const gridStroke = alpha(theme.palette.divider, 0.6);
  const axisStroke = alpha(theme.palette.text.primary, 0.35);
  const tickFill = theme.palette.text.secondary;
  const yearBandFill = alpha(theme.palette.action.hover, 0.5);
  const tt = {
    contentStyle: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      color: theme.palette.text.primary,
    } as React.CSSProperties,
    labelStyle: { color: theme.palette.text.secondary } as React.CSSProperties,
    itemStyle: { color: theme.palette.text.primary } as React.CSSProperties,
  };
  return (
    <Box>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ fontWeight: 700, mt: 2.5, mb: 0.75 }}
      >
        {t('user_profile.chart_best_send_month')}
      </Typography>
      <BestSendRechartsChart
        data={data}
        maxRowIndex={maxRowIndex}
        yearBands={yearBands}
        showYear={showYear}
        gridStroke={gridStroke}
        axisStroke={axisStroke}
        tickFill={tickFill}
        tooltipTheme={tt}
        barFill={theme.palette.secondary.main}
        yearBandFill={yearBandFill}
      />
    </Box>
  );
}

function BestSendRechartsChart({
  data,
  maxRowIndex,
  yearBands,
  showYear,
  gridStroke,
  axisStroke,
  tickFill,
  tooltipTheme,
  barFill,
  yearBandFill,
}: {
  data: Array<{ key: string; value: number; gradeLabel: string }>;
  maxRowIndex: number;
  yearBands: Array<{ year: string; x1: string; x2: string; alt: boolean }>;
  showYear: Map<string, boolean>;
  gridStroke: string;
  axisStroke: string;
  tickFill: string;
  tooltipTheme: {
    contentStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
  };
  barFill: string;
  yearBandFill: string;
}) {
  return (
    <Box sx={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 24, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          {yearBands.map((b) => (
            <ReferenceArea
              key={`band-${b.year}`}
              x1={b.x1}
              x2={b.x2}
              fill={yearBandFill}
              fillOpacity={b.alt ? 1 : 0}
              ifOverflow="extendDomain"
            />
          ))}
          <XAxis
            dataKey="key"
            interval={0}
            height={40}
            tick={monthYearTickRenderer(showYear)}
            axisLine={{ stroke: axisStroke }}
            tickLine={{ stroke: axisStroke }}
          />
          <YAxis
            domain={[0, Math.max(1, maxRowIndex + 1)]}
            tick={{ fill: tickFill, fontSize: 12 }}
            axisLine={{ stroke: axisStroke }}
            tickLine={{ stroke: axisStroke }}
          />
          <RechartsTooltip
            {...tooltipTheme}
            formatter={bestSendTooltipFormatter}
          />
          <Bar dataKey="value" fill={barFill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
