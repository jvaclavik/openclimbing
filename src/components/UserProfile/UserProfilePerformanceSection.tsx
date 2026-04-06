import React, { useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { TickStyle } from '../FeaturePanel/Climbing/types';
import { PANEL_GAP } from '../utils/PanelHelpers';
import {
  UserProfileCumulativePointsChart,
  UserProfileMonthlyPointsChart,
  UserProfilePerformanceStats,
} from './UserProfilePerformanceCharts';

const MONTH_COUNT = 12;

function monthKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonthKeys(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.unshift(monthKeyFromDate(d));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

function aggregateMonthlyPoints(ticks: FetchedClimbingTick[]) {
  const map = new Map<string, number>();
  for (const row of ticks) {
    const d = new Date(row.date);
    if (Number.isNaN(d.getTime())) {
      continue;
    }
    const k = monthKeyFromDate(d);
    map.set(k, (map.get(k) ?? 0) + row.tickScore.points);
  }
  return map;
}

function cumulativePointsSeries(ticks: FetchedClimbingTick[]) {
  const sorted = [...ticks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let sum = 0;
  return sorted.map((row) => {
    sum += row.tickScore.points;
    return { date: row.date, total: sum };
  });
}

export const UserProfilePerformanceSection = ({
  fetchedTicks,
}: {
  fetchedTicks: FetchedClimbingTick[];
}) => {
  const monthKeys = useMemo(() => lastNMonthKeys(MONTH_COUNT), []);
  const monthlyMap = useMemo(
    () => aggregateMonthlyPoints(fetchedTicks),
    [fetchedTicks],
  );
  const monthlySeries = useMemo(
    () => monthKeys.map((k) => ({ key: k, points: monthlyMap.get(k) ?? 0 })),
    [monthKeys, monthlyMap],
  );
  const maxMonthly = useMemo(
    () => Math.max(1, ...monthlySeries.map((m) => m.points)),
    [monthlySeries],
  );

  const cumulative = useMemo(
    () => cumulativePointsSeries(fetchedTicks),
    [fetchedTicks],
  );
  const maxCumulative = cumulative.length
    ? cumulative[cumulative.length - 1].total
    : 0;

  const totalPoints = useMemo(
    () => fetchedTicks.reduce((s, r) => s + r.tickScore.points, 0),
    [fetchedTicks],
  );
  const sendCount = useMemo(
    () =>
      fetchedTicks.filter((r) => (r.style as TickStyle | null) !== 'PJ').length,
    [fetchedTicks],
  );

  return (
    <Box sx={{ px: PANEL_GAP, pb: 2 }}>
      <Stack spacing={2}>
        <UserProfilePerformanceStats
          totalPoints={totalPoints}
          sendCount={sendCount}
        />
        <UserProfileMonthlyPointsChart
          monthlySeries={monthlySeries}
          maxMonthly={maxMonthly}
        />
        <UserProfileCumulativePointsChart
          cumulative={cumulative}
          maxCumulative={maxCumulative}
        />
      </Stack>
    </Box>
  );
};
