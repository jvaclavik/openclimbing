import React, { useState } from 'react';
import { Box, SelectChangeEvent, Stack } from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  DEFAULT_CLIMBING_STATS_DATE_RANGE,
  climbingStatsDateRangeToSelectValue,
  selectValueToClimbingStatsDateRange,
  type ClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { ClimbingStatsDateRangeSelect } from '../climbingStats/ClimbingStatsDateRangeSelect';
import { UserProfileBestSendByMonthChart } from './UserProfileBestSendByMonthChart';
import {
  UserProfileAreaDaysChart,
  UserProfileCumulativePointsChart,
  UserProfileGradeHistogramChart,
  UserProfileMonthlyPointsChart,
  UserProfilePerformanceStats,
  UserProfilePerformanceStatsLinks,
} from './UserProfilePerformanceCharts';
import { useUserProfilePerformanceDerived } from './useUserProfilePerformanceDerived';

export const UserProfilePerformanceSection = ({
  fetchedTicks,
}: {
  fetchedTicks: FetchedClimbingTick[];
}) => {
  const [range, setRange] = useState<ClimbingStatsDateRange>(
    DEFAULT_CLIMBING_STATS_DATE_RANGE,
  );
  const d = useUserProfilePerformanceDerived(fetchedTicks, range);

  const onRangeChange = (e: SelectChangeEvent<string>) => {
    const next = selectValueToClimbingStatsDateRange(e.target.value);
    if (next) setRange(next);
  };

  const selectValue = climbingStatsDateRangeToSelectValue(range);

  return (
    <Box sx={{ px: PANEL_GAP, pb: 2 }}>
      <Stack spacing={2}>
        <ClimbingStatsDateRangeSelect
          labelId="user-profile-period-label"
          value={selectValue}
          onChange={onRangeChange}
          years={d.years}
        />

        <UserProfilePerformanceStats
          totalPoints={d.totalPoints}
          sendCount={d.sendCount}
        />
        <UserProfilePerformanceStatsLinks />

        <UserProfileMonthlyPointsChart
          monthlySeries={d.monthlySeries}
          maxMonthly={d.maxMonthly}
        />
        <UserProfileCumulativePointsChart
          cumulative={d.cumulative}
          maxCumulative={d.maxCumulative}
        />
        <UserProfileBestSendByMonthChart
          series={d.bestSendSeries}
          maxRowIndex={d.maxBestRow}
        />
        <UserProfileAreaDaysChart
          series={d.areaSeries}
          maxDays={d.maxAreaDays}
        />
        <UserProfileGradeHistogramChart
          series={d.gradeSeries}
          maxCount={d.maxGradeCount}
        />
      </Stack>
    </Box>
  );
};
