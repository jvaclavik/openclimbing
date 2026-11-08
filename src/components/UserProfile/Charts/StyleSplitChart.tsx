import React from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { t } from '../../../services/intl';
import { ProfileSection } from '../ProfileSection';
import { STYLE_BUCKETS, StyleBucket } from './chartData';
import { ChartEmpty, styleLabel, useChartColors } from './chartTheme';

const percent = (count: number, total: number) =>
  `${Math.round((count / total) * 100)} %`;

/** One whole split into style buckets: thin bar + list with the figures. */
export const StyleSplitChart = ({
  counts,
  projects,
}: {
  counts: Record<StyleBucket, number>;
  projects: number;
}) => {
  const { styles } = useChartColors();
  const total = STYLE_BUCKETS.reduce((sum, b) => sum + counts[b], 0);
  const buckets = STYLE_BUCKETS.filter((b) => counts[b] > 0);

  return (
    <ProfileSection title={t('user_profile.charts.styles')}>
      {total === 0 ? (
        <ChartEmpty />
      ) : (
        <Stack spacing={1.25}>
          <Box sx={{ display: 'flex', gap: '2px', height: 8 }} aria-hidden>
            {buckets.map((bucket, i) => (
              <Tooltip
                key={bucket}
                title={`${styleLabel(bucket)} · ${counts[bucket]} · ${percent(
                  counts[bucket],
                  total,
                )}`}
              >
                <Box
                  sx={{
                    flex: `${counts[bucket]} 1 0`,
                    minWidth: 4,
                    bgcolor: styles[bucket],
                    borderTopLeftRadius: i === 0 ? 4 : 0,
                    borderBottomLeftRadius: i === 0 ? 4 : 0,
                    borderTopRightRadius: i === buckets.length - 1 ? 4 : 0,
                    borderBottomRightRadius: i === buckets.length - 1 ? 4 : 0,
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              columnGap: 2,
              rowGap: 0.5,
            }}
          >
            {buckets.map((bucket) => (
              <Stack
                key={bucket}
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '3px',
                    bgcolor: styles[bucket],
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                  {styleLabel(bucket)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700,
                  }}
                >
                  {counts[bucket]}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 36,
                    textAlign: 'right',
                  }}
                >
                  {percent(counts[bucket], total)}
                </Typography>
              </Stack>
            ))}
          </Box>
          {projects > 0 ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('user_profile.charts.projects_note', { count: projects })}
            </Typography>
          ) : null}
        </Stack>
      )}
    </ProfileSection>
  );
};
