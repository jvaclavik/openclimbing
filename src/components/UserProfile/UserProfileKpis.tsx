import React from 'react';
import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import { t } from '../../services/intl';
import { formatCount, tint } from '../utils/panelUi';
import { getDifficulties } from '../../services/tagging/climbing/routeGrade';
import { ConvertedRouteDifficultyBadge } from '../FeaturePanel/Climbing/ConvertedRouteDifficultyBadge';
import type { GradeRecord } from '../../services/my-ticks/personalRecords';

const VALUE_SX = {
  fontFamily: (theme) => theme.typography.h1.fontFamily,
  fontSize: { xs: 22, sm: 24 },
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'primary.main',
  fontVariantNumeric: 'tabular-nums',
  minHeight: 30,
  display: 'flex',
  alignItems: 'center',
} as const;

const Kpi = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      minWidth: 0,
      px: { xs: 1, sm: 1.5 },
      '&:first-of-type': { pl: 0 },
    }}
  >
    <Box sx={VALUE_SX}>{children}</Box>
    <Typography
      variant="caption"
      component="div"
      sx={{ color: 'text.secondary', lineHeight: 1.3 }}
    >
      {label}
    </Typography>
  </Box>
);

/** Four headline numbers of the profile, always for the whole history. */
export const UserProfileKpis = ({
  totalPoints,
  sendCount,
  hardestSend,
  leaderboardRank,
}: {
  totalPoints: number;
  sendCount: number;
  hardestSend: GradeRecord | null;
  leaderboardRank: number | null;
}) => (
  <Box
    sx={(theme) => ({
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      pt: 1.5,
      borderTop: `1px solid ${tint(theme, 0.08)}`,
      '& > * + *': { borderLeft: `1px solid ${tint(theme, 0.08)}` },
    })}
  >
    <Kpi label={t('user_profile.total_points')}>
      {formatCount(Math.round(totalPoints))}
    </Kpi>
    <Kpi label={t('user_profile.ticks_count')}>{formatCount(sendCount)}</Kpi>
    <Kpi label={t('user_profile.kpi_hardest')}>
      {hardestSend ? (
        <ConvertedRouteDifficultyBadge
          routeDifficulties={getDifficulties(hardestSend.row.tags)}
        />
      ) : (
        '—'
      )}
    </Kpi>
    <Kpi label={t('user_profile.leaderboard_rank')}>
      {leaderboardRank ? (
        <Box
          component={Link}
          href="/climbing-leaderboard"
          sx={{ color: 'inherit', textDecoration: 'none' }}
        >
          #{leaderboardRank}
        </Box>
      ) : (
        '—'
      )}
    </Kpi>
  </Box>
);
