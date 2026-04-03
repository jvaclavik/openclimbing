import { format } from 'date-fns';
import React from 'react';
import { Stack, TableCell, TableRow } from '@mui/material';
import { DEFAULT_DATA_FORMAT } from '../../../config.mjs';
import { ClimbingTick } from '../../../types';
import { TickStyle } from './types';
import { TickStyleBadge } from '../../../services/my-ticks/TickStyleBadge';
import { TickMoreButton } from './TickMoreButton';
import { getPartnersText } from '../../../services/my-ticks/tickPairing';
import { PartnersMentionsText } from './PartnersMentionsText';

type TickRowProps = {
  tick: ClimbingTick;
};

export const RouteTickRow = ({ tick }: TickRowProps) => {
  const formattedDate = tick.timestamp
    ? format(tick.timestamp, DEFAULT_DATA_FORMAT)
    : tick.id;
  const partners = getPartnersText(tick);

  return (
    <TableRow>
      <TableCell>
        <TickStyleBadge style={tick.style as TickStyle} />
      </TableCell>
      <TableCell>
        <Stack spacing={0.25} alignItems="flex-start">
          <span>{formattedDate}</span>
          {partners.trim() ? (
            <PartnersMentionsText text={partners} variant="caption" />
          ) : null}
        </Stack>
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>
        <TickMoreButton tick={tick} />
      </TableCell>
    </TableRow>
  );
};
