import ShareIcon from '@mui/icons-material/Share';
import {
  Checkbox,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { t } from '../../services/intl';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { useOsmAuthContext } from '../utils/OsmAuthContext';
import { ShareTickDialog } from './ShareTickDialog';

const DAY_HEADER_FORMAT = 'EEE d.M.yyyy';

const formatDayLabel = (sessionDate: string): string => {
  try {
    return format(parseISO(sessionDate), DAY_HEADER_FORMAT);
  } catch {
    return sessionDate;
  }
};

export type DayHeaderSelection = {
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
};

type Props = {
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  colSpan: number;
  showShareAction: boolean;
  /** Set while bulk selection mode is active. */
  selection?: DayHeaderSelection;
};

export const MyTicksDayHeader = ({
  sessionDate,
  sessionTicks,
  colSpan,
  showShareAction,
  selection,
}: Props) => {
  const { osmUser } = useOsmAuthContext();
  const [shareOpen, setShareOpen] = useState(false);
  const tickCount = sessionTicks.length;
  const representativeTick = sessionTicks[0];

  return (
    <>
      <TableRow
        sx={(theme) => ({
          backgroundColor: theme.palette.action.hover,
        })}
      >
        <TableCell colSpan={colSpan} sx={{ p: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',

              // Stick the title + share button to the left edge of the
              // horizontally scrollable TableContainer so the action stays
              // reachable even on overflowing tables.
              position: 'sticky',

              left: 0,
              width: 'fit-content',
              py: 0.5,
              // Align the day checkbox with row checkboxes (padding="checkbox").
              pl: selection ? 0.5 : 2,
              pr: 2,
            }}
          >
            {selection ? (
              <Checkbox
                size="small"
                checked={selection.checked}
                indeterminate={selection.indeterminate}
                onChange={selection.onToggle}
                slotProps={{
                  input: { 'aria-label': t('my_ticks.select.select_day') },
                }}
              />
            ) : null}
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {formatDayLabel(sessionDate)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {t('my_ticks.day_header.tick_count', {
                count: String(tickCount),
              })}
            </Typography>
            {showShareAction && !selection && osmUser && representativeTick ? (
              <Tooltip title={t('my_ticks.share.share_session_tooltip')}>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => setShareOpen(true)}
                  aria-label={t('my_ticks.share.share_session_tooltip')}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </TableCell>
      </TableRow>

      {shareOpen && osmUser && representativeTick ? (
        <ShareTickDialog
          open
          mode="session"
          tick={representativeTick}
          sessionTicks={sessionTicks}
          displayName={osmUser}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </>
  );
};
