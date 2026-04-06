import React from 'react';
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  TICK_STYLE_MULTIPLIER_DEFAULT_NO_STYLE,
  TICK_STYLE_MULTIPLIERS,
} from '../../services/my-ticks/tickScoring';
import { tickStyles } from '../../services/my-ticks/ticks';
import { TickStyleBadge } from '../../services/my-ticks/TickStyleBadge';
import { TickStyle } from '../FeaturePanel/Climbing/types';
import { t } from '../../services/intl';

export const TickScoringStylesTable = () => {
  const styleRows: Array<{ tickStyle: TickStyle; mult: number }> = [
    ...tickStyles
      .filter((s) => s.key !== null)
      .map((s) => ({
        tickStyle: s.key,
        mult: TICK_STYLE_MULTIPLIERS[
          s.key as keyof typeof TICK_STYLE_MULTIPLIERS
        ],
      })),
    {
      tickStyle: null,
      mult: TICK_STYLE_MULTIPLIER_DEFAULT_NO_STYLE,
    },
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        {t('tick_scoring.styles_heading')}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('tick_scoring.style_name')}</TableCell>
              <TableCell align="right">
                {t('tick_scoring.multiplier')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {styleRows.map((row) => (
              <TableRow key={row.tickStyle ?? 'none'}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TickStyleBadge style={row.tickStyle} />
                    {row.tickStyle === null ? (
                      <Typography
                        variant="body2"
                        component="span"
                        color="text.secondary"
                      >
                        ({tickStyles[0].name})
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell align="right">{row.mult}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
