import React from 'react';
import { Box, Tooltip } from '@mui/material';
import {
  formatFullTickDate,
  formatShortTickDate,
} from '../../services/my-ticks/tickDateFormat';

/** Compact date ("Dnes", "7.6.", "7.6.2024"); the full date on hover. */
export const TickDate = ({ value }: { value: string }) => (
  <Tooltip title={formatFullTickDate(value)} enterDelay={300} arrow>
    <Box
      component="span"
      sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
    >
      {formatShortTickDate(value)}
    </Box>
  </Tooltip>
);
