import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { t } from '../../services/intl';
import { formatCount } from '../utils/panelUi';

/** "96 b." with an explanation on hover. */
export const TickPoints = ({
  points,
  tooltip = t('my_ticks.points_tooltip'),
}: {
  points: number;
  tooltip?: string;
}) => (
  <Tooltip title={tooltip} enterDelay={300} arrow>
    <Box
      component="span"
      sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
    >
      {t('user_profile.unit.points', {
        count: formatCount(Math.round(points)),
      })}
    </Box>
  </Tooltip>
);
