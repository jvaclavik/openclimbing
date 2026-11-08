import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { t, tPlural } from '../../../services/intl';
import { ProfileSection } from '../ProfileSection';
import { ChartEmpty, useChartColors } from './chartTheme';

/** Ranked bars: crags by number of climbing days. */
export const TopCragsChart = ({
  crags,
}: {
  crags: { name: string; days: number }[];
}) => {
  const { mark } = useChartColors();
  const max = Math.max(1, ...crags.map((c) => c.days));
  return (
    <ProfileSection title={t('user_profile.charts.top_crags')}>
      {crags.length === 0 ? (
        <ChartEmpty />
      ) : (
        <Stack spacing={0.75} role="list">
          {crags.map((crag) => (
            <Box
              key={crag.name}
              role="listitem"
              aria-label={`${crag.name}: ${tPlural(
                'user_profile.unit.days',
                crag.days,
              )}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 38%) minmax(0, 1fr)',
                columnGap: 1.25,
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body2"
                noWrap
                title={crag.name}
                sx={{ textAlign: 'right' }}
              >
                {crag.name}
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: `${(crag.days / max) * 80}%`,
                    minWidth: 4,
                    height: 12,
                    bgcolor: mark,
                    borderRadius: '0 4px 4px 0',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {tPlural('user_profile.unit.days', crag.days)}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </ProfileSection>
  );
};
