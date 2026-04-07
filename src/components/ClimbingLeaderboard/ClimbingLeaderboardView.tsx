import React from 'react';
import {
  Alert,
  CircularProgress,
  Paper,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { format } from 'date-fns';
import { ClimbingLeaderboardEntry } from '../../services/my-ticks/myTicksApi';
import { profilePathForOsmDisplayName } from '../../services/my-ticks/profilePaths';
import { t } from '../../services/intl';
import { DEFAULT_DATA_FORMAT } from '../../config.mjs';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { ClimbingStatsDateRangeSelect } from '../climbingStats/ClimbingStatsDateRangeSelect';

export type LeaderboardUiState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | {
      kind: 'ready';
      entries: ClimbingLeaderboardEntry[];
      periodStartIso: string | null;
      periodEndIso: string | null;
      periodRange: string;
    };

function leaderboardPeriodSubtext(
  state: Extract<LeaderboardUiState, { kind: 'ready' }>,
): string {
  if (state.periodRange === 'all') {
    return t('leaderboard.period_all_note');
  }
  if (state.periodRange.startsWith('year:')) {
    return t('leaderboard.period_year_note', {
      year: state.periodRange.slice(5),
    });
  }
  if (state.periodStartIso && state.periodEndIso) {
    return t('leaderboard.period_rolling_note', {
      from: format(new Date(state.periodStartIso), DEFAULT_DATA_FORMAT),
      to: format(new Date(state.periodEndIso), DEFAULT_DATA_FORMAT),
    });
  }
  return t('leaderboard.period_all_note');
}

function LeaderboardPeriodSelect({
  rangeSelectValue,
  onRangeChange,
  availableYears,
}: {
  rangeSelectValue: string;
  onRangeChange: (e: SelectChangeEvent<string>) => void;
  availableYears: number[];
}) {
  return (
    <ClimbingStatsDateRangeSelect
      labelId="leaderboard-period-label"
      value={rangeSelectValue}
      onChange={onRangeChange}
      years={availableYears}
    />
  );
}

function ClimbingLeaderboardEntriesTable({
  entries,
}: {
  entries: ClimbingLeaderboardEntry[];
}) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={48}>#</TableCell>
            <TableCell>{t('leaderboard.column_user')}</TableCell>
            <TableCell align="right">
              {t('leaderboard.column_points')}
            </TableCell>
            <TableCell align="right">{t('leaderboard.column_ticks')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((row, index) => (
            <TableRow key={row.osmUserId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Typography
                  component={Link}
                  href={profilePathForOsmDisplayName(row.displayName)}
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {row.displayName}
                </Typography>
              </TableCell>
              <TableCell align="right">{row.points}</TableCell>
              <TableCell align="right">{row.tickCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function ClimbingLeaderboardView({
  state,
  rangeSelectValue,
  onRangeChange,
  availableYears,
}: {
  state: LeaderboardUiState;
  rangeSelectValue: string;
  onRangeChange: (e: SelectChangeEvent<string>) => void;
  availableYears: number[];
}) {
  if (state.kind === 'loading') {
    return (
      <PanelSidePadding>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('leaderboard.title')}
          </Typography>
          <LeaderboardPeriodSelect
            rangeSelectValue={rangeSelectValue}
            onRangeChange={onRangeChange}
            availableYears={availableYears}
          />
          <CircularProgress />
        </Stack>
      </PanelSidePadding>
    );
  }

  if (state.kind === 'error') {
    return (
      <PanelSidePadding>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('leaderboard.title')}
          </Typography>
          <LeaderboardPeriodSelect
            rangeSelectValue={rangeSelectValue}
            onRangeChange={onRangeChange}
            availableYears={availableYears}
          />
          <Alert severity="error" variant="outlined">
            {t('leaderboard.load_error')}
          </Alert>
        </Stack>
      </PanelSidePadding>
    );
  }

  return (
    <>
      <PanelSidePadding>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('leaderboard.title')}
          </Typography>
          <LeaderboardPeriodSelect
            rangeSelectValue={rangeSelectValue}
            onRangeChange={onRangeChange}
            availableYears={availableYears}
          />
          <Typography variant="body2" color="text.secondary" paragraph>
            {leaderboardPeriodSubtext(state)}
          </Typography>
        </Stack>
      </PanelSidePadding>

      {state.entries.length === 0 ? (
        <PanelSidePadding>
          <Alert severity="info" variant="outlined">
            {t('leaderboard.empty')}
          </Alert>
        </PanelSidePadding>
      ) : (
        <PanelSidePadding>
          <ClimbingLeaderboardEntriesTable entries={state.entries} />
        </PanelSidePadding>
      )}
    </>
  );
}
