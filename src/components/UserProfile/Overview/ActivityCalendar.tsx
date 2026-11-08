import React, { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { t, tPlural } from '../../../services/intl';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { tint } from '../../utils/panelUi';
import { ProfileSection } from '../ProfileSection';
import {
  buildActivityCalendar,
  CALENDAR_WEEKS,
  CalendarDay,
} from './activityCalendarData';
import { formatFullTickDate } from '../../../services/my-ticks/tickDateFormat';

const LEVEL_ALPHA = [0, 0.28, 0.5, 0.75, 1];

const monthFormatter = (lang: string) => {
  try {
    return new Intl.DateTimeFormat(lang || 'en', { month: 'short' });
  } catch {
    return new Intl.DateTimeFormat('en', { month: 'short' });
  }
};

const dayTitle = (cell: CalendarDay) =>
  cell.ticks > 0
    ? `${formatFullTickDate(cell.day)} · ${tPlural(
        'user_profile.unit.sends',
        cell.sends,
      )}`
    : formatFullTickDate(cell.day);

const useCellColor = () => {
  const theme = useTheme();
  return (level: number) =>
    level === 0
      ? tint(theme, 0.06)
      : alpha(theme.palette.primary.main, LEVEL_ALPHA[level]);
};

const Legend = () => {
  const color = useCellColor();
  return (
    <Stack
      direction="row"
      spacing={0.4}
      sx={{ alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', pr: 0.5 }}>
        {t('user_profile.activity.less')}
      </Typography>
      {[0, 1, 2, 3, 4].map((level) => (
        <Box
          key={level}
          sx={{
            width: 9,
            height: 9,
            borderRadius: '2px',
            bgcolor: color(level),
          }}
        />
      ))}
      <Typography variant="caption" sx={{ color: 'text.secondary', pl: 0.5 }}>
        {t('user_profile.activity.more')}
      </Typography>
    </Stack>
  );
};

export const ActivityCalendar = ({
  fetchedTicks,
  lang,
  onOpenDay,
}: {
  fetchedTicks: FetchedClimbingTick[];
  lang: string;
  onOpenDay: (day: string) => void;
}) => {
  const data = useMemo(
    () => buildActivityCalendar(fetchedTicks),
    [fetchedTicks],
  );
  const color = useCellColor();
  const months = monthFormatter(lang);
  const columns = `repeat(${CALENDAR_WEEKS}, minmax(0, 1fr))`;

  return (
    <ProfileSection
      title={t('user_profile.activity.title')}
      addition={
        <Typography variant="caption">
          {tPlural('user_profile.activity.active_days', data.activeDays)}
        </Typography>
      }
    >
      <Stack spacing={0.75}>
        <Box sx={{ display: 'grid', gridTemplateColumns: columns, height: 14 }}>
          {data.months.map(({ column, date }) => (
            <Typography
              key={column}
              variant="caption"
              sx={{
                gridColumn: `${column + 1} / span 4`,
                fontSize: 10,
                lineHeight: '14px',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {months.format(date)}
            </Typography>
          ))}
        </Box>
        <Box
          role="group"
          aria-label={t('user_profile.activity.title')}
          sx={{
            display: 'grid',
            gridTemplateColumns: columns,
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
            gap: '2px',
          }}
        >
          {data.weeks.flat().map((cell) => {
            const cellSx = {
              aspectRatio: '1',
              borderRadius: '2px',
              bgcolor: cell.future ? 'transparent' : color(cell.level),
            };
            // Days with ticks open the diary: real buttons, so they are
            // reachable by keyboard and named for screen readers.
            return cell.ticks > 0 ? (
              <Box
                key={cell.day}
                component="button"
                type="button"
                title={dayTitle(cell)}
                aria-label={dayTitle(cell)}
                onClick={() => onOpenDay(cell.day)}
                sx={(theme) => ({
                  ...cellSx,
                  p: 0,
                  border: 0,
                  minWidth: 0,
                  cursor: 'pointer',
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.text.primary}`,
                    outlineOffset: 1,
                  },
                })}
              />
            ) : (
              <Box
                key={cell.day}
                aria-hidden
                title={cell.future ? undefined : dayTitle(cell)}
                sx={cellSx}
              />
            );
          })}
        </Box>
        <Legend />
      </Stack>
    </ProfileSection>
  );
};
