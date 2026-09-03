import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Box,
  Button,
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
import { UserProfilePerformanceStats } from './UserProfilePerformanceStats';
import {
  MyTicksContent,
  MyTicksEmptyHint,
} from '../MyTicksPanel/MyTicksContent';
import { fetchedTicksToGraphFeatures } from '../MyTicksPanel/mapMyTicksRows';
import { useUserProfilePerformanceDerived } from './useUserProfilePerformanceDerived';
import { useUserProfileLeaderboardRank } from './useUserProfileLeaderboardRank';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';
import { t } from '../../services/intl';
import {
  buildTicksCsv,
  buildTicksCsvFilename,
} from '../../services/my-ticks/exportTicksCsv';

const UserProfileChartsTab = dynamic(
  () => import('./UserProfileChartsTab').then((m) => m.UserProfileChartsTab),
  { ssr: false },
);

function UserProfilePerformanceTopBar({
  years,
  selectValue,
  onRangeChange,
  onExportCsv,
  exportDisabled,
}: {
  years: number[];
  selectValue: string;
  onRangeChange: (e: SelectChangeEvent<string>) => void;
  onExportCsv: () => void;
  exportDisabled: boolean;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        pt: 0.5,
      }}
    >
      <ClimbingStatsDateRangeSelect
        labelId="user-profile-period-label"
        value={selectValue}
        onChange={onRangeChange}
        years={years}
      />
      <Box sx={{ flex: 1 }} />
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<DownloadIcon />}
        onClick={onExportCsv}
        disabled={exportDisabled}
      >
        {t('user_profile.export_csv')}
      </Button>
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
  const exportDisabled = !ticksPanelEnabled || fetchedTicks.length === 0;

  const onExportCsv = () => {
    const csv = buildTicksCsv(fetchedTicks);
    const filename = buildTicksCsvFilename(displayName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ px: PANEL_GAP, pb: 2 }}>
      <UserProfilePerformanceContent
        years={d.years}
        selectValue={selectValue}
        onRangeChange={onRangeChange}
        onExportCsv={onExportCsv}
        exportDisabled={exportDisabled}
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
  onExportCsv,
  exportDisabled,
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
  onExportCsv: () => void;
  exportDisabled: boolean;
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
        onExportCsv={onExportCsv}
        exportDisabled={exportDisabled}
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
  // When ticksPanelEnabled is false, data is still loading (either own ticks
  // from TicksContext or public profile fetch). Render nothing here — the
  // parent scroll content shows a loader for the whole panel.
  if (!ticksPanelEnabled) {
    return null;
  }

  return (
    <Box sx={{ pt: 1 }}>
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
    </Box>
  );
}
