import React from 'react';
import { Alert, Stack } from '@mui/material';
import { intl, t } from '../../../services/intl';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import {
  Milestone,
  PersonalRecords,
} from '../../../services/my-ticks/personalRecords';
import { PersonalRecordsSection } from './PersonalRecordsSection';
import { ActivityCalendar } from './ActivityCalendar';
import { MilestonesTimeline } from './MilestonesTimeline';

export const UserProfileOverviewTab = ({
  fetchedTicks,
  records,
  milestones,
  own,
  onOpenDay,
}: {
  fetchedTicks: FetchedClimbingTick[];
  records: PersonalRecords;
  milestones: Milestone[];
  own: boolean;
  onOpenDay: (day: string) => void;
}) => {
  if (fetchedTicks.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        {own ? t('my_ticks.no_ticks_paragraph1') : t('user_profile.no_ticks')}
      </Alert>
    );
  }

  return (
    <Stack spacing={3.5} sx={{ pt: 1 }}>
      <PersonalRecordsSection records={records} onOpenDay={onOpenDay} />
      <ActivityCalendar
        fetchedTicks={fetchedTicks}
        lang={intl.lang}
        onOpenDay={onOpenDay}
      />
      <MilestonesTimeline milestones={milestones} onOpenDay={onOpenDay} />
    </Stack>
  );
};
