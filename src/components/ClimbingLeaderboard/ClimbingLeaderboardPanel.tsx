import React, { useEffect, useState } from 'react';
import Router from 'next/router';
import { SelectChangeEvent, Typography } from '@mui/material';
import { fetchClimbingTicksLeaderboard } from '../../services/my-ticks/myTicksApi';
import {
  DEFAULT_CLIMBING_STATS_DATE_RANGE,
  climbingStatsDateRangeToSelectValue,
  selectValueToClimbingStatsDateRange,
} from '../../services/my-ticks/climbingStatsDateRange';
import { t } from '../../services/intl';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { ClientOnly } from '../helpers';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { PROJECT_ID } from '../../services/project';
import {
  ClimbingLeaderboardView,
  LeaderboardUiState,
} from './ClimbingLeaderboardView';

export const ClimbingLeaderboardPanel = () => {
  const [rangeValue, setRangeValue] = useState(() =>
    climbingStatsDateRangeToSelectValue(DEFAULT_CLIMBING_STATS_DATE_RANGE),
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [state, setState] = useState<LeaderboardUiState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetchClimbingTicksLeaderboard(rangeValue)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setAvailableYears(data.availableYears);
        setState({
          kind: 'ready',
          entries: data.entries,
          periodStartIso: data.periodStartIso,
          periodEndIso: data.periodEndIso,
          periodRange: data.periodRange,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ kind: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rangeValue]);

  const onRangeChange = (e: SelectChangeEvent<string>) => {
    const next = selectValueToClimbingStatsDateRange(e.target.value);
    if (next) {
      setRangeValue(climbingStatsDateRangeToSelectValue(next));
    }
  };

  const handleClose = () => {
    Router.push(`/`);
  };

  if (PROJECT_ID !== 'openclimbing') {
    return (
      <ClientOnly>
        <MobilePageDrawer className="my-ticks-drawer">
          <PanelContent>
            <PanelScrollbars>
              <ClosePanelButton right onClick={handleClose} />
              <PanelSidePadding>
                <Typography variant="body1">
                  {t('user_profile.unavailable_project')}
                </Typography>
              </PanelSidePadding>
            </PanelScrollbars>
          </PanelContent>
        </MobilePageDrawer>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <MobilePageDrawer className="my-ticks-drawer">
        <PanelContent>
          <PanelScrollbars>
            <ClosePanelButton right onClick={handleClose} />
            <ClimbingLeaderboardView
              state={state}
              rangeSelectValue={rangeValue}
              onRangeChange={onRangeChange}
              availableYears={availableYears}
            />
          </PanelScrollbars>
        </PanelContent>
      </MobilePageDrawer>
    </ClientOnly>
  );
};
