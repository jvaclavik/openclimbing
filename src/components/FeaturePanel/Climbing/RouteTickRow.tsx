import React from 'react';
import { Stack, TableCell, TableRow } from '@mui/material';
import { ClimbingTick } from '../../../types';
import { FeatureTags } from '../../../services/types';
import { TickStyle } from './types';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import { TickMoreButton } from './TickMoreButton';
import { getPartnersText } from '../../../services/my-ticks/tickPairing';
import { computeTickScore } from '../../../services/my-ticks/tickScoring';
import { GradeSystem } from '../../../services/tagging/climbing/gradeSystems';
import { tint } from '../../utils/panelUi';
import { TickDate } from '../../MyTicksPanel/TickDate';
import { TickPoints } from '../../MyTicksPanel/TickPoints';
import { TickRowCaption } from '../../MyTicksPanel/TickRowCaption';
import {
  ACTION_CELL_CLASS,
  tickRowHoverSx,
} from '../../MyTicksPanel/TickSessionCard';

type TickRowProps = {
  tick: ClimbingTick;
  routeTags: FeatureTags | undefined;
  gradeSystem: GradeSystem;
};

/** One of my ascents in the route detail — same row as in the diary. */
export const RouteTickRow = ({
  tick,
  routeTags,
  gradeSystem,
}: TickRowProps) => {
  const { points } = computeTickScore(routeTags, tick, gradeSystem);
  return (
    <TableRow
      sx={(theme) => ({
        '& > td': { borderBottom: `1px solid ${tint(theme, 0.05)}` },
        ...tickRowHoverSx(theme),
      })}
    >
      <TableCell>
        <Stack spacing={0.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          <Stack component="span" sx={{ fontWeight: 600 }}>
            <TickDate value={tick.timestamp} />
          </Stack>
          <TickRowCaption partners={getPartnersText(tick)} note={tick.note} />
        </Stack>
      </TableCell>
      <TableCell>
        <TickStyleBadge style={tick.style as TickStyle} />
      </TableCell>
      <TableCell
        sx={{
          textAlign: 'right',
          color: 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <TickPoints points={points} />
      </TableCell>
      <TableCell className={ACTION_CELL_CLASS}>
        <TickMoreButton tick={tick} />
      </TableCell>
    </TableRow>
  );
};
