import React from 'react';
import { Box } from '@mui/material';
import type { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { UserProfileBestSendByMonthChart } from './UserProfileBestSendByMonthChart';
import {
  UserProfileAreaDaysChart,
  UserProfileGradeHistogramChart,
  UserProfileMonthlyPointsChart,
  UserProfileTickStylePieChart,
  UserProfileWeekdayRadarChart,
} from './UserProfilePerformanceCharts';
import { MyTicksGraphs } from '../MyTicksPanel/MyTicksGraphs/MyTicksGraphs';
import type { fetchedTicksToGraphFeatures } from '../MyTicksPanel/mapMyTicksRows';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';

// Recharts (~heavy, incl. its d3/victory-vendor deps) lives entirely in these
// charts, which only render on the (non-default) "charts" tab. This whole tab is
// dynamically imported so recharts is fetched on demand, not with the profile
// route's initial JS.
export function UserProfileChartsTab({
  monthlySeries,
  maxMonthly,
  bestSendSeries,
  maxBestRow,
  stylePie,
  weekdayRadar,
  areaSeries,
  maxAreaDays,
  gradeSeries,
  maxGradeCount,
  routeDistributionFeatures,
}: {
  monthlySeries: { key: string; points: number }[];
  maxMonthly: number;
  bestSendSeries: Array<{ key: string; gradeLabel: string; rowIndex: number }>;
  maxBestRow: number;
  stylePie: Array<{ key: string; name: string; value: number; color: string }>;
  weekdayRadar: Array<{ key: string; label: string; value: number }>;
  areaSeries: Array<{ crag: string; days: number }>;
  maxAreaDays: number;
  gradeSeries: Array<{
    grade: string;
    total: number;
    segments: GradeStyleSegment[];
    sampleTick: FetchedClimbingTick | null;
  }>;
  maxGradeCount: number;
  routeDistributionFeatures: ReturnType<typeof fetchedTicksToGraphFeatures>;
}) {
  return (
    <Box sx={{ pt: 1 }}>
      <UserProfileMonthlyPointsChart
        monthlySeries={monthlySeries}
        maxMonthly={maxMonthly}
        isFirstChart
      />
      <UserProfileBestSendByMonthChart
        series={bestSendSeries}
        maxRowIndex={maxBestRow}
      />
      <UserProfileTickStylePieChart data={stylePie} />
      <UserProfileWeekdayRadarChart data={weekdayRadar} />
      <UserProfileAreaDaysChart series={areaSeries} maxDays={maxAreaDays} />
      <UserProfileGradeHistogramChart
        series={gradeSeries}
        maxCount={maxGradeCount}
      />
      <MyTicksGraphs features={routeDistributionFeatures} />
    </Box>
  );
}
