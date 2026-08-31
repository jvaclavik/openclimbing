import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { t } from '../../services/intl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import type { TickStyle } from '../FeaturePanel/Climbing/types';
import {
  TICK_STYLE_SEGMENT_ORDER,
  tickStyleToChartColor,
  tickStyles,
} from '../../services/my-ticks/ticks';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';
import { styleSegmentKey } from './userProfileCareerAggregates';
import {
  ProfileChartSection,
  useRechartsAxisTheme,
  useRechartsTooltipTheme,
} from './userProfileChartTheme';

/** Neviditelný sloupec, který stack odstrčí doprava, aby byl vycentrovaný. */
const SPACER_KEY = '__spacer__';

const ROW_HEIGHT = 26;
const CHART_CHROME_HEIGHT = 72;

type GradeRow = {
  grade: string;
  total: number;
  segments: GradeStyleSegment[];
  sampleTick: FetchedClimbingTick | null;
};

function styleName(key: string): string {
  const hit = tickStyles.find((s) => styleSegmentKey(s.key) === key);
  return hit ? hit.name : key;
}

/** V legendě chceme jen styly, které se v datech opravdu vyskytly. */
function usedStyles(series: GradeRow[]): TickStyle[] {
  return TICK_STYLE_SEGMENT_ORDER.filter((style) =>
    series.some((row) =>
      row.segments.some(
        (segment) => segment.style === style && segment.count > 0,
      ),
    ),
  );
}

function toPyramidData(series: GradeRow[], maxCount: number) {
  return series.map((row) => {
    const out: Record<string, string | number> = {
      grade: row.grade,
      total: row.total,
      [SPACER_KEY]: Math.max(0, (maxCount - row.total) / 2),
    };
    for (const segment of row.segments) {
      out[styleSegmentKey(segment.style)] = segment.count;
    }
    return out;
  });
}

function PyramidTooltip({
  active,
  payload,
  label,
  contentStyle,
  labelStyle,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    value?: number;
    color?: string;
  }>;
  label?: string;
  contentStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const rows = payload.filter(
    (item) => item.dataKey !== SPACER_KEY && Number(item.value) > 0,
  );
  const total = rows.reduce((sum, item) => sum + Number(item.value ?? 0), 0);
  return (
    <Box sx={{ px: 1.25, py: 1 }} style={contentStyle}>
      <Typography variant="body2" style={labelStyle}>
        {label} · {total} {t('user_profile.chart_ascents_unit')}
      </Typography>
      {rows.map((item) => (
        <Typography
          key={String(item.dataKey)}
          variant="body2"
          sx={{ color: item.color }}
        >
          {styleName(String(item.dataKey))}: {item.value}
        </Typography>
      ))}
    </Box>
  );
}

export function UserProfileGradePyramidChart({
  series,
  maxCount,
  isFirstChart = false,
}: {
  series: GradeRow[];
  maxCount: number;
  /** První graf v sekci — bez horního odsazení nadpisu. */
  isFirstChart?: boolean;
}) {
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  if (series.length === 0) {
    return null;
  }
  const data = toPyramidData(series, maxCount);
  const height = Math.max(
    260,
    series.length * ROW_HEIGHT + CHART_CHROME_HEIGHT,
  );
  return (
    <ProfileChartSection
      title={t('user_profile.chart_grade_pyramid')}
      height={height}
      isFirstChart={isFirstChart}
    >
      <BarChart
        data={data}
        layout="vertical"
        barCategoryGap={2}
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          stroke={ax.gridStroke}
        />
        <XAxis type="number" domain={[0, Math.max(1, maxCount)]} hide />
        <YAxis
          type="category"
          dataKey="grade"
          width={64}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <RechartsTooltip
          cursor={false}
          content={
            <PyramidTooltip
              contentStyle={tt.contentStyle}
              labelStyle={tt.labelStyle}
            />
          }
        />
        <Legend wrapperStyle={ax.legendWrapperStyle} />
        <Bar
          dataKey={SPACER_KEY}
          stackId="pyramid"
          fill="transparent"
          stroke="none"
          legendType="none"
          isAnimationActive={false}
        />
        {usedStyles(series).map((style) => {
          const key = styleSegmentKey(style);
          return (
            <Bar
              key={`pyramid-${key}`}
              dataKey={key}
              name={styleName(key)}
              stackId="pyramid"
              fill={tickStyleToChartColor(style)}
              stroke="none"
            />
          );
        })}
      </BarChart>
    </ProfileChartSection>
  );
}
