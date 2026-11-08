import React from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { t, tPlural } from '../../../services/intl';
import { ProfileSection } from '../ProfileSection';
import { PyramidRow, STYLE_BUCKETS } from './chartData';
import {
  ChartEmpty,
  StyleLegend,
  styleLabel,
  useChartColors,
} from './chartTheme';

const BAR_HEIGHT = 14;

const rowTooltip = (row: PyramidRow) =>
  [
    `${row.grade}: ${tPlural('user_profile.unit.sends', row.total)}`,
    ...STYLE_BUCKETS.filter((b) => row.counts[b] > 0).map(
      (b) => `${styleLabel(b)} ${row.counts[b]}`,
    ),
  ].join(' · ');

const PyramidBar = ({ row, max }: { row: PyramidRow; max: number }) => {
  const { styles } = useChartColors();
  const buckets = STYLE_BUCKETS.filter((b) => row.counts[b] > 0);
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '2px', // surface gap between segments
        width: `${(row.total / max) * 100}%`,
        minWidth: 4,
        height: BAR_HEIGHT,
      }}
    >
      {buckets.map((bucket, i) => (
        <Box
          key={bucket}
          sx={{
            flex: `${row.counts[bucket]} 1 0`,
            minWidth: 2,
            bgcolor: styles[bucket],
            // rounded data end, square at the baseline
            borderRadius: i === buckets.length - 1 ? '0 4px 4px 0' : 0,
          }}
        />
      ))}
    </Box>
  );
};

export const GradePyramidChart = ({ rows }: { rows: PyramidRow[] }) => {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <ProfileSection title={t('user_profile.charts.pyramid')}>
      {rows.length === 0 ? (
        <ChartEmpty />
      ) : (
        <Stack spacing={0.5} role="list">
          <Box sx={{ pb: 0.75 }}>
            <StyleLegend />
          </Box>
          {rows.map((row) => (
            <Tooltip
              key={row.gradeIndex}
              title={rowTooltip(row)}
              placement="top-start"
              enterDelay={150}
            >
              <Box
                role="listitem"
                aria-label={rowTooltip(row)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(0, 1fr) 32px',
                  columnGap: 1,
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    textAlign: 'right',
                    color: 'text.secondary',
                  }}
                >
                  {row.grade}
                </Typography>
                <PyramidBar row={row} max={max} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.total}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Stack>
      )}
    </ProfileSection>
  );
};
