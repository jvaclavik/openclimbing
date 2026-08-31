import React from 'react';
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
import {
  TICK_STYLE_SEGMENT_ORDER,
  tickStyleToChartColor,
  tickStyles,
} from '../../services/my-ticks/ticks';
import {
  styleSegmentKey,
  type YearlyAscentsRow,
} from './userProfileCareerAggregates';
import {
  ProfileChartSection,
  useRechartsAxisTheme,
  useRechartsTooltipTheme,
} from './userProfileChartTheme';

function styleName(key: string): string {
  const hit = tickStyles.find((s) => styleSegmentKey(s.key) === key);
  return hit ? hit.name : key;
}

/** Vykreslíme jen styly, které se v datech opravdu vyskytly. */
function usedStyleKeys(series: YearlyAscentsRow[]): string[] {
  return TICK_STYLE_SEGMENT_ORDER.map(styleSegmentKey).filter((key) =>
    series.some((row) => Number(row[key] ?? 0) > 0),
  );
}

export function UserProfileYearlyAscentsChart({
  series,
}: {
  series: YearlyAscentsRow[];
}) {
  const tt = useRechartsTooltipTheme();
  const ax = useRechartsAxisTheme();
  if (series.length === 0) {
    return null;
  }
  const styleKeys = usedStyleKeys(series);
  const maxTotal = Math.max(1, ...series.map((row) => row.total));
  return (
    <ProfileChartSection
      title={t('user_profile.chart_yearly_ascents')}
      note={t('user_profile.chart_all_time_note')}
      height={280}
    >
      <BarChart
        data={series}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={ax.gridStroke} />
        <XAxis
          dataKey="year"
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <YAxis
          domain={[0, maxTotal]}
          allowDecimals={false}
          tick={{ fill: ax.tickFill, fontSize: 12 }}
          axisLine={{ stroke: ax.axisStroke }}
          tickLine={{ stroke: ax.axisStroke }}
        />
        <RechartsTooltip {...tt} />
        <Legend wrapperStyle={ax.legendWrapperStyle} />
        {styleKeys.map((key, i) => (
          <Bar
            key={`year-${key}`}
            dataKey={key}
            name={styleName(key)}
            stackId="year"
            fill={tickStyleToChartColor(
              TICK_STYLE_SEGMENT_ORDER.find(
                (s) => styleSegmentKey(s) === key,
              ) ?? null,
            )}
            stroke="none"
            radius={i === styleKeys.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ProfileChartSection>
  );
}
