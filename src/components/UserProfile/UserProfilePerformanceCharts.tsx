import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  IconButton,
  Link as MuiLink,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { t } from '../../services/intl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import type { TickStyle } from '../FeaturePanel/Climbing/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  tickStyleToChartColor,
  TICK_STYLE_SEGMENT_ORDER,
} from '../../services/my-ticks/ticks';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';

const PROFILE_CHART_TITLE_SX = {
  fontWeight: 700,
  mt: 2.5,
  mb: 0.75,
} as const;

const PolarAngleAxisAny = PolarAngleAxis as unknown as React.ComponentType<any>;

function useRechartsTooltipTheme() {
  const theme = useTheme();
  return {
    contentStyle: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      color: theme.palette.text.primary,
    } as React.CSSProperties,
    labelStyle: { color: theme.palette.text.secondary } as React.CSSProperties,
    itemStyle: { color: theme.palette.text.primary } as React.CSSProperties,
  };
}

function useRechartsAxisTheme() {
  const theme = useTheme();
  return {
    gridStroke: alpha(theme.palette.divider, 0.6),
    axisStroke: alpha(theme.palette.text.primary, 0.35),
    tickFill: theme.palette.text.secondary,
    legendWrapperStyle: {
      color: theme.palette.text.primary,
    } as React.CSSProperties,
  };
}

function parseMonthKey(key: string): { year: string; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return { year: '', month: 0 };
  return { year: m[1], month: parseInt(m[2], 10) };
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

export function UserProfileMonthlyPointsChart({
  monthlySeries,
  maxMonthly,
  isFirstChart = false,
}: {
  monthlySeries: { key: string; points: number }[];
  maxMonthly: number;
  /** První graf v sekci — bez horního odsazení nadpisu. */
  isFirstChart?: boolean;
}) {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{
          ...PROFILE_CHART_TITLE_SX,
          ...(isFirstChart ? { mt: 0 } : {}),
        }}
      >
        {t('user_profile.chart_monthly_points')}
      </Typography>
      <MonthlyPointsRechartsChart
        monthlySeries={monthlySeries}
        maxMonthly={maxMonthly}
      />
    </Box>
  );
}

function MonthlyPointsRechartsChart({
  monthlySeries,
  maxMonthly,
}: {
  monthlySeries: { key: string; points: number }[];
  maxMonthly: number;
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  const showYear = buildShowYearMap(monthlySeries.map((m) => m.key));
  const yearBands = buildYearBands(monthlySeries.map((m) => m.key));
  return (
    <Box sx={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={monthlySeries}
          margin={{ top: 8, right: 12, bottom: 24, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={ax.gridStroke} />
          {yearBands.map((b) => (
            <ReferenceArea
              key={`band-${b.year}`}
              x1={b.x1}
              x2={b.x2}
              fill={alpha(theme.palette.action.hover, 0.5)}
              fillOpacity={b.alt ? 1 : 0}
              ifOverflow="extendDomain"
            />
          ))}
          <XAxis
            dataKey="key"
            interval={0}
            height={40}
            tick={monthYearTickRenderer(showYear)}
            axisLine={{ stroke: ax.axisStroke }}
            tickLine={{ stroke: ax.axisStroke }}
          />
          <YAxis
            domain={[0, Math.max(1, maxMonthly)]}
            tick={{ fill: ax.tickFill, fontSize: 12 }}
            axisLine={{ stroke: ax.axisStroke }}
            tickLine={{ stroke: ax.axisStroke }}
          />
          <RechartsTooltip {...tt} />
          <Bar
            dataKey="points"
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
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

export function UserProfilePerformanceStats({
  totalPoints,
  tickCount,
  leaderboardRank,
}: {
  totalPoints: number;
  tickCount: number;
  leaderboardRank: number | null;
}) {
  return (
    <Box component="section">
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2.5,
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <UserProfileStatTotalPoints totalPoints={totalPoints} />
        <UserProfileStatSimple
          label={t('user_profile.ticks_count')}
          value={tickCount}
        />
        <UserProfileStatLeaderboardRank rank={leaderboardRank} />
      </Box>
    </Box>
  );
}

function UserProfileStatSimple({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" component="p">
        {value}
      </Typography>
    </Box>
  );
}

function UserProfileStatTotalPoints({ totalPoints }: { totalPoints: number }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Typography variant="body2" color="text.secondary" component="span">
          {t('user_profile.total_points')}
        </Typography>
        <Tooltip
          title={
            <MuiLink component={Link} href="/tick-scoring" variant="body2">
              {t('tick_scoring.menu_link')}
            </MuiLink>
          }
        >
          <IconButton
            size="small"
            aria-label={t('tick_scoring.menu_link')}
            sx={{ p: 0.25 }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 18 }} color="action" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="h4" component="p">
        {totalPoints}
      </Typography>
    </Box>
  );
}

function UserProfileStatLeaderboardRank({ rank }: { rank: number | null }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="body2" color="text.secondary">
        {t('user_profile.leaderboard_rank')}
      </Typography>
      <Typography
        component={Link}
        href="/climbing-leaderboard"
        variant="h4"
        sx={{
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          display: 'inline-block',
        }}
      >
        {rank ?? '—'}
      </Typography>
    </Box>
  );
}

export function UserProfileTickStylePieChart({
  data,
}: {
  data: Array<{ key: string; name: string; value: number; color: string }>;
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const tooltipFormatter = (value: any, _name: any, props: any) => {
    const name = props?.payload?.name ?? '';
    return [value, name];
  };
  if (data.length === 0) return null;
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_style_pie')}
      </Typography>
      <Box sx={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <RechartsTooltip {...tt} formatter={tooltipFormatter} />
            <Legend
              wrapperStyle={
                { color: theme.palette.text.primary } as React.CSSProperties
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export function UserProfileWeekdayRadarChart({
  data,
}: {
  data: Array<{ key: string; label: string; value: number }>;
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  const tooltipFormatter = (value: any) => [value, 'ticks'];
  if (data.length === 0) return null;
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_weekday_radar')}
      </Typography>
      <Box sx={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke={ax.gridStroke} />
            <PolarAngleAxisAny
              dataKey="label"
              tick={{ fill: ax.tickFill, fontSize: 12 }}
            />
            <RechartsTooltip {...tt} formatter={tooltipFormatter} />
            <Radar
              dataKey="value"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

type CragDatum = { crag: string; days: number };

export function UserProfileAreaDaysChart({
  series,
  maxDays,
}: {
  series: CragDatum[];
  maxDays: number;
}) {
  const theme = useTheme();
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  if (series.length === 0) {
    return null;
  }
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_area_days')}
      </Typography>
      <Box sx={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={series}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={ax.gridStroke} />
            <XAxis
              type="number"
              domain={[0, Math.max(1, maxDays)]}
              tick={{ fill: ax.tickFill, fontSize: 12 }}
              axisLine={{ stroke: ax.axisStroke }}
              tickLine={{ stroke: ax.axisStroke }}
            />
            <YAxis
              type="category"
              dataKey="crag"
              width={140}
              tick={{ fill: ax.tickFill, fontSize: 12 }}
              axisLine={{ stroke: ax.axisStroke }}
              tickLine={{ stroke: ax.axisStroke }}
            />
            <RechartsTooltip {...tt} />
            <Bar
              dataKey="days"
              fill={theme.palette.primary.main}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export function UserProfileGradeHistogramChart({
  series,
  maxCount,
}: {
  series: Array<{
    grade: string;
    total: number;
    segments: GradeStyleSegment[];
    sampleTick: FetchedClimbingTick | null;
  }>;
  maxCount: number;
}) {
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  if (series.length === 0) {
    return null;
  }
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_grade_distribution')}
      </Typography>
      <GradeHistogramRechartsChart
        series={series}
        maxCount={maxCount}
        tt={tt}
        ax={ax}
      />
    </Box>
  );
}

function GradeHistogramRechartsChart({
  series,
  maxCount,
  tt,
  ax,
}: {
  series: Array<{
    grade: string;
    total: number;
    segments: GradeStyleSegment[];
    sampleTick: FetchedClimbingTick | null;
  }>;
  maxCount: number;
  tt: ReturnType<typeof useRechartsTooltipTheme>;
  ax: ReturnType<typeof useRechartsAxisTheme>;
}) {
  const styleKeys: TickStyle[] = [...TICK_STYLE_SEGMENT_ORDER];
  const data = series.map((row) => {
    const out: Record<string, any> = { grade: row.grade, total: row.total };
    for (const seg of row.segments) {
      const k = seg.style == null ? '—' : String(seg.style);
      out[k] = seg.count;
    }
    return out;
  });
  return (
    <Box sx={{ width: '100%', height: 420 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={ax.gridStroke} />
          <XAxis
            type="number"
            domain={[0, Math.max(1, maxCount)]}
            tick={{ fill: ax.tickFill, fontSize: 12 }}
            axisLine={{ stroke: ax.axisStroke }}
            tickLine={{ stroke: ax.axisStroke }}
          />
          <YAxis
            type="category"
            dataKey="grade"
            width={90}
            tick={{ fill: ax.tickFill, fontSize: 12 }}
            axisLine={{ stroke: ax.axisStroke }}
            tickLine={{ stroke: ax.axisStroke }}
          />
          <RechartsTooltip {...tt} />
          <Legend wrapperStyle={ax.legendWrapperStyle} />
          {styleKeys.map((s) => {
            const k = s == null ? '—' : String(s);
            return (
              <Bar
                key={`bar-${k}`}
                dataKey={k}
                stackId="a"
                fill={tickStyleToChartColor(s)}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
