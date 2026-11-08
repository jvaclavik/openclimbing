import React, { useMemo } from 'react';
import { Stack } from '@mui/material';
import type { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  gradeProgression,
  gradePyramid,
  sendsByMonth,
  styleSplit,
  topCrags,
} from './Charts/chartData';
import { GradeProgressionChart } from './Charts/GradeProgressionChart';
import { GradePyramidChart } from './Charts/GradePyramidChart';
import { SendsByMonthChart } from './Charts/SendsByMonthChart';
import { StyleSplitChart } from './Charts/StyleSplitChart';
import { TopCragsChart } from './Charts/TopCragsChart';

// Recharts (~heavy, incl. its d3/victory-vendor deps) lives in these charts,
// which only render on the (non-default) "charts" tab. This whole tab is
// dynamically imported so recharts is fetched on demand.
export function UserProfileChartsTab({
  rows,
  monthKeys,
}: {
  /** Ticks of the selected period. */
  rows: FetchedClimbingTick[];
  monthKeys: string[];
}) {
  const data = useMemo(
    () => ({
      progression: gradeProgression(rows, monthKeys),
      pyramid: gradePyramid(rows),
      monthly: sendsByMonth(rows, monthKeys),
      styles: styleSplit(rows),
      crags: topCrags(rows),
    }),
    [rows, monthKeys],
  );

  return (
    <Stack spacing={4}>
      <GradeProgressionChart data={data.progression} />
      <GradePyramidChart rows={data.pyramid} />
      <SendsByMonthChart data={data.monthly} />
      <StyleSplitChart
        counts={data.styles.counts}
        projects={data.styles.projects}
      />
      <TopCragsChart crags={data.crags} />
    </Stack>
  );
}
