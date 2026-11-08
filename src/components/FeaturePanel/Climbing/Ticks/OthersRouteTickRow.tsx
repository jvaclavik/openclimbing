import React from 'react';
import { Box, Stack, TableCell, TableRow } from '@mui/material';
import Link from 'next/link';
import { t } from '../../../../services/intl';
import { TickStyle } from '../types';
import { TickStyleBadge } from '../../../../services/my-ticks/TickStyleBadge';
import { getPartnersText } from '../../../../services/my-ticks/tickPairing';
import { profilePathForOsmDisplayName } from '../../../../services/my-ticks/profilePaths';
import { MentionedClimbingTick } from '../../../../services/my-ticks/tickMentions';
import { tint } from '../../../utils/panelUi';
import { TickDate } from '../../../MyTicksPanel/TickDate';
import { TickRowCaption } from '../../../MyTicksPanel/TickRowCaption';
import { ROUTE_NAME_SX } from '../../../MyTicksPanel/MyTicksRow';
import { tickRowHoverSx } from '../../../MyTicksPanel/TickSessionCard';

/** Another climber's ascent of this route (route detail). */
export const OthersRouteTickRow = ({
  tick,
}: {
  tick: MentionedClimbingTick;
}) => (
  <TableRow
    sx={(theme) => ({
      '& > td': { borderBottom: `1px solid ${tint(theme, 0.05)}` },
      ...tickRowHoverSx(theme),
    })}
  >
    <TableCell>
      <Stack spacing={0.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
        {tick.ownerDisplayName ? (
          <Box
            component={Link}
            href={profilePathForOsmDisplayName(tick.ownerDisplayName)}
            sx={{ ...ROUTE_NAME_SX, overflowWrap: 'anywhere' }}
          >
            {tick.ownerDisplayName}
          </Box>
        ) : (
          <Box
            component="span"
            sx={{ ...ROUTE_NAME_SX, color: 'text.secondary' }}
          >
            {t('route_ticks.unknown_climber')}
          </Box>
        )}
        <TickRowCaption partners={getPartnersText(tick)} note={tick.note} />
      </Stack>
    </TableCell>
    <TableCell>
      <TickStyleBadge style={tick.style as TickStyle} />
    </TableCell>
    <TableCell sx={{ textAlign: 'right', color: 'text.secondary' }}>
      <TickDate value={tick.timestamp} />
    </TableCell>
  </TableRow>
);
