import React from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  IconButton,
  Link as MuiLink,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { t } from '../../services/intl';

const STAT_BOX_SX = { flex: '1 1 0', minWidth: 0 };
const STAT_LABEL_SX = {
  fontSize: { xs: '0.72rem', sm: '0.78rem' },
  lineHeight: 1.2,
};
const STAT_VALUE_SX = {
  fontSize: { xs: '1.4rem', sm: '1.75rem' },
  lineHeight: 1.2,
  fontWeight: 500,
};

function UserProfileStatSimple({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Box sx={STAT_BOX_SX}>
      <Typography variant="body2" color="text.secondary" sx={STAT_LABEL_SX}>
        {label}
      </Typography>
      <Typography component="p" sx={STAT_VALUE_SX}>
        {value}
      </Typography>
    </Box>
  );
}

function UserProfileStatTotalPoints({ totalPoints }: { totalPoints: number }) {
  return (
    <Box sx={STAT_BOX_SX}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          component="span"
          sx={STAT_LABEL_SX}
        >
          {t('user_profile.total_points')}
        </Typography>
        <Tooltip
          title={
            <MuiLink component={Link} href="/tick-scoring" variant="body2">
              {t('tick_scoring.menu_link')}
            </MuiLink>
          }
        >
          <IconButton
            size="small"
            aria-label={t('tick_scoring.menu_link')}
            sx={{ p: 0.25 }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 16 }} color="action" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography component="p" sx={STAT_VALUE_SX}>
        {totalPoints}
      </Typography>
    </Box>
  );
}

function UserProfileStatLeaderboardRank({ rank }: { rank: number | null }) {
  return (
    <Box sx={STAT_BOX_SX}>
      <Typography variant="body2" color="text.secondary" sx={STAT_LABEL_SX}>
        {t('user_profile.leaderboard_rank')}
      </Typography>
      <Typography
        component={Link}
        href="/climbing-leaderboard"
        sx={{
          ...STAT_VALUE_SX,
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          display: 'inline-block',
        }}
      >
        {rank ?? '—'}
      </Typography>
    </Box>
  );
}

export function UserProfilePerformanceStats({
  totalPoints,
  tickCount,
  leaderboardRank,
}: {
  totalPoints: number;
  tickCount: number;
  leaderboardRank: number | null;
}) {
  return (
    <Box component="section">
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: { xs: 1, sm: 2 },
          alignItems: 'flex-start',
        }}
      >
        <UserProfileStatTotalPoints totalPoints={totalPoints} />
        <UserProfileStatSimple
          label={t('user_profile.ticks_count')}
          value={tickCount}
        />
        <UserProfileStatLeaderboardRank rank={leaderboardRank} />
      </Box>
    </Box>
  );
}
