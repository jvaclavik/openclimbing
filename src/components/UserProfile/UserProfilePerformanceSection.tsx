import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { PANEL_GAP } from '../utils/PanelHelpers';
import { tint } from '../utils/panelUi';
import { t } from '../../services/intl';
import {
  isTicksFilterActive,
  useTicksUrlFilter,
} from '../../services/my-ticks/ticksUrlFilter';
import {
  computeMilestones,
  computePersonalRecords,
} from '../../services/my-ticks/personalRecords';
import { totalTickPoints } from './userProfilePerformanceAggregates';
import { useUserProfileLeaderboardRank } from './useUserProfileLeaderboardRank';
import { UserProfileKpis } from './UserProfileKpis';
import { UserProfileOverviewTab } from './Overview/UserProfileOverviewTab';
import { UserProfileDiaryTab } from './UserProfileDiaryTab';
import { UserProfileChartsSection } from './UserProfileChartsSection';
import { MentionedTicksTab } from '../MyTicksPanel/MentionedTicks/MentionedTicksTab';
import { useMentionedTicksState } from '../MyTicksPanel/MentionedTicks/useMentionedTicks';

type ProfileTab = 'overview' | 'ticks' | 'mentions' | 'charts';

const CountBadge = ({ count }: { count: number }) => (
  <Box
    component="span"
    sx={{
      ml: 0.75,
      px: 0.75,
      minWidth: 20,
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: '18px',
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {count}
  </Box>
);

function UserProfileTabs({
  tab,
  onTabChange,
  own,
}: {
  tab: ProfileTab;
  onTabChange: (value: ProfileTab) => void;
  own: boolean;
}) {
  // Shares the react-query cache with the mentions tab itself.
  const { pendingCount } = useMentionedTicksState(own);
  return (
    <Tabs
      value={tab}
      onChange={(_, value: ProfileTab) => onTabChange(value)}
      variant="scrollable"
      scrollButtons={false}
      sx={(theme) => ({
        minHeight: 40,
        borderBottom: `1px solid ${tint(theme, 0.08)}`,
        '& .MuiTab-root': {
          minHeight: 40,
          minWidth: 0,
          px: 1.5,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: 15,
        },
      })}
    >
      <Tab value="overview" label={t('user_profile.tab_overview')} />
      <Tab value="ticks" label={t('user_profile.tab_ticks')} />
      {own ? (
        <Tab
          value="mentions"
          label={
            <Box component="span" sx={{ display: 'inline-flex' }}>
              {t('user_profile.tab_mentions')}
              {pendingCount > 0 ? <CountBadge count={pendingCount} /> : null}
            </Box>
          }
        />
      ) : null}
      <Tab value="charts" label={t('user_profile.tab_charts')} />
    </Tabs>
  );
}

/** Opens one climbing day in the diary (URL `?session=` filter). */
const useOpenDayInDiary = (showDiary: () => void) => {
  const router = useRouter();
  return (day: string) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, session: day } },
      undefined,
      { shallow: true, scroll: false },
    );
    showDiary();
  };
};

const useProfileData = (fetchedTicks: FetchedClimbingTick[]) => {
  const records = useMemo(
    () => computePersonalRecords(fetchedTicks),
    [fetchedTicks],
  );
  const milestones = useMemo(
    () => computeMilestones(fetchedTicks),
    [fetchedTicks],
  );
  const personalBestIds = useMemo(
    () =>
      new Set(
        milestones.flatMap((m) =>
          m.kind === 'grade_pb' ? [m.row.tick.id] : [],
        ),
      ),
    [milestones],
  );
  const totalPoints = useMemo(
    () => totalTickPoints(fetchedTicks),
    [fetchedTicks],
  );
  return { records, milestones, personalBestIds, totalPoints };
};

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
  const filter = useTicksUrlFilter();
  // Own profile is mostly managed, others are mostly browsed. Shared links to
  // a day / tick always land in the diary.
  const [tab, setTab] = useState<ProfileTab>(() =>
    own || isTicksFilterActive(filter) ? 'ticks' : 'overview',
  );
  const activeTab = tab === 'mentions' && !own ? 'ticks' : tab;
  const { records, milestones, personalBestIds, totalPoints } =
    useProfileData(fetchedTicks);
  const leaderboardRank = useUserProfileLeaderboardRank(displayName, 'all');
  const openDay = useOpenDayInDiary(() => setTab('ticks'));

  // While ticks are still loading the parent shows a loader for the panel.
  if (!ticksPanelEnabled) {
    return null;
  }

  return (
    <Box sx={{ px: PANEL_GAP, pb: 3 }}>
      <Stack spacing={2}>
        <UserProfileKpis
          totalPoints={totalPoints}
          sendCount={records.sendCount}
          hardestSend={records.hardestSend}
          leaderboardRank={leaderboardRank}
        />
        <UserProfileTabs tab={activeTab} onTabChange={setTab} own={own} />
        {activeTab === 'overview' ? (
          <UserProfileOverviewTab
            fetchedTicks={fetchedTicks}
            records={records}
            milestones={milestones}
            own={own}
            onOpenDay={openDay}
          />
        ) : null}
        {activeTab === 'ticks' ? (
          <UserProfileDiaryTab
            own={own}
            fetchedTicks={fetchedTicks}
            personalBestIds={personalBestIds}
          />
        ) : null}
        {activeTab === 'mentions' ? <MentionedTicksTab /> : null}
        {activeTab === 'charts' ? (
          <UserProfileChartsSection fetchedTicks={fetchedTicks} />
        ) : null}
      </Stack>
    </Box>
  );
};
