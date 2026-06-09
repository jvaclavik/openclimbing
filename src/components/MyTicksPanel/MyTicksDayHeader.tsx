import ShareIcon from '@mui/icons-material/Share';
import {
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

type Props = {
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  colSpan: number;
  showShareAction: boolean;
};

export const MyTicksDayHeader = ({
  sessionDate,
  sessionTicks,
  colSpan,
  showShareAction,
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
            alignItems="center"
            spacing={1}
            sx={{
              // Stick the title + share button to the left edge of the
              // horizontally scrollable TableContainer so the action stays
              // reachable even on overflowing tables.
              position: 'sticky',
              left: 0,
              width: 'fit-content',
              py: 0.5,
              px: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {formatDayLabel(sessionDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('my_ticks.day_header.tick_count', {
                count: String(tickCount),
              })}
            </Typography>
            {showShareAction && osmUser && representativeTick ? (
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
