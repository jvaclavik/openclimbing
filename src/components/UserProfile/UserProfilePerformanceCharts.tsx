import React from 'react';
import { Box, Button, Link as MuiLink, Typography } from '@mui/material';
import Link from 'next/link';
import { t } from '../../services/intl';

const CHART_W = 320;
const CHART_H = 120;
const CHART_PAD = 8;

type MonthlyDatum = { key: string; points: number };

export function UserProfileMonthlyPointsChart({
  monthlySeries,
  maxMonthly,
}: {
  monthlySeries: MonthlyDatum[];
  maxMonthly: number;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t('user_profile.chart_monthly_points')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.5,
          height: 112,
          pt: 1,
        }}
      >
        {monthlySeries.map(({ key, points }) => {
          const barH =
            points > 0 ? Math.max(8, (points / maxMonthly) * 100) : 2;
          return (
            <Box
              key={key}
              sx={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5,
              }}
              title={`${key}: ${points}`}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${barH}%`,
                  bgcolor:
                    points > 0 ? 'primary.main' : 'action.disabledBackground',
                  borderRadius: 0.5,
                }}
              />
            </Box>
          );
        })}
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          mt: 0.5,
          justifyContent: 'space-between',
        }}
      >
        {monthlySeries.map(({ key }) => (
          <Typography
            key={`${key}-lbl`}
            variant="caption"
            color="text.secondary"
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: '0.6rem',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {key.slice(2)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export function UserProfileCumulativePointsChart({
  cumulative,
  maxCumulative,
}: {
  cumulative: Array<{ date: string; total: number }>;
  maxCumulative: number;
}) {
  const denom = Math.max(1, cumulative.length - 1);
  const dPath = cumulative
    .map((p, i) => {
      const x = CHART_PAD + (i / denom) * (CHART_W - CHART_PAD * 2);
      const y =
        CHART_H -
        CHART_PAD -
        (maxCumulative > 0
          ? (p.total / maxCumulative) * (CHART_H - CHART_PAD * 2)
          : 0);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  if (cumulative.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t('user_profile.chart_cumulative_points')}
      </Typography>
      <Box sx={{ width: '100%', overflow: 'auto' }}>
        <svg
          width="100%"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          style={{ display: 'block' }}
          aria-label={t('user_profile.chart_cumulative_points')}
        >
          <path
            d={dPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'var(--mui-palette-primary-main)' }}
          />
        </svg>
      </Box>
      <MuiLink
        component={Link}
        href="/tick-scoring"
        variant="caption"
        sx={{ display: 'inline-block', mt: 1 }}
      >
        {t('tick_scoring.how_it_works_link')}
      </MuiLink>
    </Box>
  );
}

export function UserProfilePerformanceStats({
  totalPoints,
  sendCount,
}: {
  totalPoints: number;
  sendCount: number;
}) {
  return (
    <Box
      component="section"
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(0,0,0,0.03) 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('user_profile.total_points')}
          </Typography>
          <Typography variant="h4" component="p">
            {totalPoints}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {t('user_profile.sends_count')}
          </Typography>
          <Typography variant="h4" component="p">
            {sendCount}
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/tick-scoring"
          variant="outlined"
          size="small"
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
        >
          {t('tick_scoring.menu_link')}
        </Button>
      </Box>
    </Box>
  );
}
