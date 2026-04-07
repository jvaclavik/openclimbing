import React, { useState } from 'react';
import {
  Alert,
  Box,
  SelectChangeEvent,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import {
  DEFAULT_CLIMBING_STATS_DATE_RANGE,
  climbingStatsDateRangeToSelectValue,
  selectValueToClimbingStatsDateRange,
  type ClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { ClimbingStatsDateRangeSelect } from '../climbingStats/ClimbingStatsDateRangeSelect';
import { GradeSystemSelect } from '../FeaturePanel/Climbing/GradeSystemSelect';
import { UserProfileBestSendByMonthChart } from './UserProfileBestSendByMonthChart';
import {
  UserProfileAreaDaysChart,
  UserProfileGradeHistogramChart,
  UserProfileMonthlyPointsChart,
  UserProfilePerformanceStats,
  UserProfileTickStylePieChart,
  UserProfileWeekdayRadarChart,
} from './UserProfilePerformanceCharts';
import {
  MyTicksContent,
  MyTicksEmptyHint,
} from '../MyTicksPanel/MyTicksContent';
import { MyTicksGraphs } from '../MyTicksPanel/MyTicksGraphs/MyTicksGraphs';
import { fetchedTicksToGraphFeatures } from '../MyTicksPanel/mapMyTicksRows';
import { useUserProfilePerformanceDerived } from './useUserProfilePerformanceDerived';
import { useUserProfileLeaderboardRank } from './useUserProfileLeaderboardRank';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';
import { t } from '../../services/intl';

function UserProfilePerformanceTopBar({
  years,
  selectValue,
  onRangeChange,
}: {
  years: number[];
  selectValue: string;
  onRangeChange: (e: SelectChangeEvent<string>) => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ pt: 0.5 }}
    >
      <ClimbingStatsDateRangeSelect
        labelId="user-profile-period-label"
        value={selectValue}
        onChange={onRangeChange}
        years={years}
      />
      <Box sx={{ flex: 1 }} />
      <GradeSystemSelect size="small" />
    </Stack>
  );
}

export const UserProfilePerformanceSection = ({
  displayName,
  own,
  ticksPanelEnabled,
  fetchedTicks,
}: {
  displayName: string;
  own: boolean;
  ticksPanelEnabled: boolean;
  fetchedTicks: FetchedClimbingTick[];
}) => {
  const [range, setRange] = useState<ClimbingStatsDateRange>(
    DEFAULT_CLIMBING_STATS_DATE_RANGE,
  );
  const d = useUserProfilePerformanceDerived(fetchedTicks, range);
  const [tab, setTab] = useState(0);

  const onRangeChange = (e: SelectChangeEvent<string>) => {
    const next = selectValueToClimbingStatsDateRange(e.target.value);
    if (next) setRange(next);
  };

  const selectValue = climbingStatsDateRangeToSelectValue(range);

  const leaderboardRank = useUserProfileLeaderboardRank(
    displayName,
    selectValue,
  );

  return (
    <Box sx={{ px: PANEL_GAP, pb: 2 }}>
      <UserProfilePerformanceContent
        years={d.years}
        selectValue={selectValue}
        onRangeChange={onRangeChange}
        totalPoints={d.totalPoints}
        tickCount={d.tickCount}
        leaderboardRank={leaderboardRank}
        monthlySeries={d.monthlySeries}
        maxMonthly={d.maxMonthly}
        bestSendSeries={d.bestSendSeries}
        maxBestRow={d.maxBestRow}
        areaSeries={d.areaSeries}
        maxAreaDays={d.maxAreaDays}
        gradeSeries={d.gradeSeries}
        maxGradeCount={d.maxGradeCount}
        stylePie={d.stylePie}
        weekdayRadar={d.weekdayRadar}
        tab={tab}
        onTabChange={(_, v) => setTab(v)}
        own={own}
        ticksPanelEnabled={ticksPanelEnabled}
        fetchedTicks={fetchedTicks}
      />
    </Box>
  );
};

function UserProfilePerformanceContent({
  years,
  selectValue,
  onRangeChange,
  totalPoints,
  tickCount,
  leaderboardRank,
  monthlySeries,
  maxMonthly,
  bestSendSeries,
  maxBestRow,
  areaSeries,
  maxAreaDays,
  gradeSeries,
  maxGradeCount,
  stylePie,
  weekdayRadar,
  tab,
  onTabChange,
  own,
  ticksPanelEnabled,
  fetchedTicks,
}: {
  years: number[];
  selectValue: string;
  onRangeChange: (e: SelectChangeEvent<string>) => void;
  totalPoints: number;
  tickCount: number;
  leaderboardRank: number | null;
  monthlySeries: { key: string; points: number }[];
  maxMonthly: number;
  bestSendSeries: Array<{ key: string; gradeLabel: string; rowIndex: number }>;
  maxBestRow: number;
  areaSeries: Array<{ crag: string; days: number }>;
  maxAreaDays: number;
  gradeSeries: Array<{
    grade: string;
    total: number;
    segments: GradeStyleSegment[];
    sampleTick: FetchedClimbingTick | null;
  }>;
  maxGradeCount: number;
  stylePie: Array<{ key: string; name: string; value: number; color: string }>;
  weekdayRadar: Array<{ key: string; label: string; value: number }>;
  tab: number;
  onTabChange: (e: React.SyntheticEvent, value: number) => void;
  own: boolean;
  ticksPanelEnabled: boolean;
  fetchedTicks: FetchedClimbingTick[];
}) {
  return (
    <Stack spacing={2.5}>
      <UserProfilePerformanceTopBar
        years={years}
        selectValue={selectValue}
        onRangeChange={onRangeChange}
      />

      <UserProfilePerformanceStats
        totalPoints={totalPoints}
        tickCount={tickCount}
        leaderboardRank={leaderboardRank}
      />

      <UserProfileProfileTabs tab={tab} onTabChange={onTabChange} />

      {tab === 0 ? (
        <UserProfileTicksTab
          own={own}
          ticksPanelEnabled={ticksPanelEnabled}
          fetchedTicks={fetchedTicks}
        />
      ) : (
        <UserProfileChartsTab
          monthlySeries={monthlySeries}
          maxMonthly={maxMonthly}
          bestSendSeries={bestSendSeries}
          maxBestRow={maxBestRow}
          stylePie={stylePie}
          weekdayRadar={weekdayRadar}
          areaSeries={areaSeries}
          maxAreaDays={maxAreaDays}
          gradeSeries={gradeSeries}
          maxGradeCount={maxGradeCount}
          routeDistributionFeatures={fetchedTicksToGraphFeatures(fetchedTicks)}
        />
      )}
    </Stack>
  );
}

function UserProfileProfileTabs({
  tab,
  onTabChange,
}: {
  tab: number;
  onTabChange: (e: React.SyntheticEvent, value: number) => void;
}) {
  return (
    <Tabs
      value={tab}
      onChange={onTabChange}
      variant="fullWidth"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Tab label={t('user_profile.tab_ticks')} />
      <Tab label={t('user_profile.tab_charts')} />
    </Tabs>
  );
}

function UserProfileTicksTab({
  own,
  ticksPanelEnabled,
  fetchedTicks,
}: {
  own: boolean;
  ticksPanelEnabled: boolean;
  fetchedTicks: FetchedClimbingTick[];
}) {
  return (
    <Box sx={{ pt: 1 }}>
      {ticksPanelEnabled ? (
        <>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            {t('user_profile.ticks_table_title')}
          </Typography>
          <MyTicksContent
            fetchedTicks={fetchedTicks}
            readOnly={!own}
            emptyTicksMessage={
              own ? (
                <MyTicksEmptyHint />
              ) : (
                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                  {t('user_profile.no_ticks')}
                </Alert>
              )
            }
          />
        </>
      ) : (
        <Alert severity="info" variant="outlined">
          {t('user_profile.no_ticks')}
        </Alert>
      )}
    </Box>
  );
}

function UserProfileChartsTab({
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
