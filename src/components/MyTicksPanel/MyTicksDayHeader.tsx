import ShareIcon from '@mui/icons-material/Share';
import { Box, Checkbox, IconButton, Tooltip, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { t, tPlural } from '../../services/intl';
import { getUrlOsmId } from '../../services/helpers';
import { tint } from '../utils/panelUi';
import { FetchedClimbingTick } from '../../services/my-ticks/getMyTicks';
import { useOsmAuthContext } from '../utils/OsmAuthContext';
import { useMapStateContext } from '../utils/MapStateContext';
import { ShareTickDialog } from './ShareTickDialog';
import { TickDate } from './TickDate';
import { TickPoints } from './TickPoints';
import { DayCrag, getDayCrags } from './dayCrags';

const MAX_CRAGS_IN_HEADER = 2;

export type DayHeaderSelection = {
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
};

type Props = {
  sessionDate: string;
  sessionTicks: FetchedClimbingTick[];
  showShareAction: boolean;
  /** Set while bulk selection mode is active. */
  selection?: DayHeaderSelection;
};

const TITLE_SX = {
  fontWeight: 700,
  fontSize: 15,
  lineHeight: 1.3,
  color: 'text.primary',
  textDecoration: 'none',
} as const;

/** Crag names link to the crag; its panel then offers "Back to diary". */
const CragLinks = ({ crags }: { crags: DayCrag[] }) => {
  const router = useRouter();
  const { view } = useMapStateContext();
  const shown = crags.slice(0, MAX_CRAGS_IN_HEADER);
  const rest = crags.length - shown.length;
  return (
    <Box component="span" sx={{ minWidth: 0 }}>
      {shown.map((crag, i) => (
        <React.Fragment key={crag.name}>
          {i > 0 ? ', ' : null}
          {crag.osmId ? (
            <Box
              component={Link}
              href={`/${getUrlOsmId(crag.osmId)}?back=${encodeURIComponent(
                router.asPath,
              )}#${view.join('/')}`}
              sx={{ ...TITLE_SX, '&:hover': { color: 'primary.main' } }}
            >
              {crag.name}
            </Box>
          ) : (
            <Box component="span" sx={TITLE_SX}>
              {crag.name}
            </Box>
          )}
        </React.Fragment>
      ))}
      {rest > 0 ? (
        <Box component="span" sx={{ ...TITLE_SX, color: 'text.secondary' }}>
          {` +${rest}`}
        </Box>
      ) : null}
    </Box>
  );
};

const DayTitle = ({
  sessionDate,
  crags,
}: {
  sessionDate: string;
  crags: DayCrag[];
}) =>
  crags.length > 0 ? (
    <Box
      sx={{
        minWidth: 0,
        flex: 1,
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        columnGap: 1,
      }}
    >
      <CragLinks crags={crags} />
      <Typography variant="body2" component="span" color="text.secondary">
        <TickDate value={sessionDate} />
      </Typography>
    </Box>
  ) : (
    <Box component="span" sx={{ ...TITLE_SX, flex: 1 }}>
      <TickDate value={sessionDate} />
    </Box>
  );

export const MyTicksDayHeader = ({
  sessionDate,
  sessionTicks,
  showShareAction,
  selection,
}: Props) => {
  const { osmUser } = useOsmAuthContext();
  const [shareOpen, setShareOpen] = useState(false);
  const representativeTick = sessionTicks[0];
  const points = sessionTicks.reduce(
    (sum, row) => sum + (row.tickScore?.points ?? 0),
    0,
  );

  return (
    <>
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 46,
          py: 0.75,
          // Align the day checkbox with row checkboxes (padding="checkbox").
          pl: selection ? 0.75 : 2,
          pr: 1,
          borderBottom: `1px solid ${tint(theme, 0.06)}`,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: `linear-gradient(${tint(theme, 0.025)}, ${tint(
            theme,
            0.025,
          )})`,
        })}
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
        <DayTitle sessionDate={sessionDate} crags={getDayCrags(sessionTicks)} />
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {tPlural('user_profile.unit.sends', sessionTicks.length)}
          {' · '}
          <TickPoints
            points={points}
            tooltip={t('my_ticks.day_points_tooltip')}
          />
        </Typography>
        {showShareAction && !selection && osmUser && representativeTick ? (
          <Tooltip title={t('my_ticks.share.share_session_tooltip')}>
            <IconButton
              size="small"
              color="secondary"
              onClick={() => setShareOpen(true)}
              aria-label={t('my_ticks.share.share_session_tooltip')}
              sx={{ mr: -0.5 }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>

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
