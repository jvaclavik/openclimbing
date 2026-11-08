import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SelectChangeEvent, Stack } from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  DEFAULT_CLIMBING_STATS_DATE_RANGE,
  climbingStatsDateRangeToSelectValue,
  filterFetchedTicksByRange,
  getYearsPresentInTicks,
  selectValueToClimbingStatsDateRange,
  type ClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';
import { ClimbingStatsDateRangeSelect } from '../climbingStats/ClimbingStatsDateRangeSelect';
import { GradeSystemSelect } from '../FeaturePanel/Climbing/GradeSystemSelect';
import { chartMonthKeys } from './Charts/chartData';

const UserProfileChartsTab = dynamic(
  () => import('./UserProfileChartsTab').then((m) => m.UserProfileChartsTab),
  { ssr: false },
);

/** "Grafy" tab: period selection lives here, the rest of the profile is all-time. */
export const UserProfileChartsSection = ({
  fetchedTicks,
}: {
  fetchedTicks: FetchedClimbingTick[];
}) => {
  const [range, setRange] = useState<ClimbingStatsDateRange>(
    DEFAULT_CLIMBING_STATS_DATE_RANGE,
  );
  const years = useMemo(
    () => getYearsPresentInTicks(fetchedTicks),
    [fetchedTicks],
  );
  const rows = useMemo(
    () => filterFetchedTicksByRange(fetchedTicks, range),
    [fetchedTicks, range],
  );
  const monthKeys = useMemo(
    () => chartMonthKeys(range, fetchedTicks),
    [range, fetchedTicks],
  );

  const onRangeChange = (e: SelectChangeEvent<string>) => {
    const next = selectValueToClimbingStatsDateRange(e.target.value);
    if (next) setRange(next);
  };

  return (
    <Stack spacing={3} sx={{ pt: 1 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <ClimbingStatsDateRangeSelect
          labelId="user-profile-period-label"
          value={climbingStatsDateRangeToSelectValue(range)}
          onChange={onRangeChange}
          years={years}
        />
        <GradeSystemSelect size="small" />
      </Stack>
      <UserProfileChartsTab rows={rows} monthKeys={monthKeys} />
    </Stack>
  );
};
