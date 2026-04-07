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
import { tickStyleToChartColor } from '../../services/my-ticks/ticks';
import type { GradeStyleSegment } from './userProfilePerformanceAggregates';

const CHART_W = 320;
const CHART_H = 120;
const CHART_PAD = 8;

const PROFILE_CHART_TITLE_SX = {
  fontWeight: 700,
  mt: 2.5,
  mb: 0.75,
} as const;

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
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
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
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
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
          flexWrap: 'wrap',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Typography variant="body2" color="text.secondary" component="span">
              {t('user_profile.sends_count')}
            </Typography>
            <Tooltip title={t('user_profile.sends_count_tooltip')}>
              <IconButton
                size="small"
                aria-label={t('user_profile.sends_count_tooltip')}
                sx={{ p: 0.25 }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18 }} color="action" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="h4" component="p">
            {sendCount}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function UserProfilePerformanceStatsLinks() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        pl: 0.25,
      }}
    >
      <MuiLink component={Link} href="/tick-scoring" variant="body2">
        {t('tick_scoring.menu_link')}
      </MuiLink>
      <MuiLink component={Link} href="/climbing-leaderboard" variant="body2">
        {t('leaderboard.menu_link')}
      </MuiLink>
    </Box>
  );
}

type AreaDatum = { area: string; days: number };

export function UserProfileAreaDaysChart({
  series,
  maxDays,
}: {
  series: AreaDatum[];
  maxDays: number;
}) {
  if (series.length === 0) {
    return null;
  }
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_area_days')}
      </Typography>
      <StackedHorizontalBars
        rows={series.map((s) => ({
          label: s.area,
          value: s.days,
          title: `${s.area}: ${s.days} ${t('user_profile.area_days_unit')}`,
        }))}
        maxValue={maxDays}
        barColor="primary.main"
      />
    </Box>
  );
}

function gradeSegmentsTooltip(
  grade: string,
  segments: GradeStyleSegment[],
): string {
  const parts = segments.map((s) => `${s.style ?? '—'}×${s.count}`);
  return `${grade}: ${parts.join(', ')}`;
}

export function UserProfileGradeHistogramChart({
  series,
  maxCount,
}: {
  series: Array<{
    grade: string;
    total: number;
    segments: GradeStyleSegment[];
  }>;
  maxCount: number;
}) {
  if (series.length === 0) {
    return null;
  }
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={PROFILE_CHART_TITLE_SX}>
        {t('user_profile.chart_grade_distribution')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {series.map((row, i) => {
          const wPct = Math.max(4, (row.total / maxCount) * 100);
          return (
            <Box
              key={`${row.grade}-${i}`}
              title={gradeSegmentsTooltip(row.grade, row.segments)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    width: 120,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.grade}
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      height: 10,
                      width: `${wPct}%`,
                      maxWidth: '100%',
                      display: 'flex',
                      borderRadius: 0.5,
                      overflow: 'hidden',
                    }}
                  >
                    {row.segments.map((seg, si) => (
                      <Box
                        key={`${row.grade}-seg-${si}-${String(seg.style)}`}
                        sx={{
                          flexGrow: seg.count,
                          flexBasis: 0,
                          minWidth: seg.count > 0 ? 2 : 0,
                          bgcolor: tickStyleToChartColor(seg.style),
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0 }}
                  >
                    {row.total}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function StackedHorizontalBars({
  rows,
  maxValue,
  barColor,
}: {
  rows: { label: string; value: number; title: string }[];
  maxValue: number;
  barColor: string;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {rows.map((r, i) => {
        const wPct = Math.max(4, (r.value / maxValue) * 100);
        return (
          <Box key={`${r.label}-${i}`} title={r.title}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  width: 120,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.label}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    height: 10,
                    width: `${wPct}%`,
                    maxWidth: '100%',
                    bgcolor: barColor,
                    borderRadius: 0.5,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ flexShrink: 0 }}
                >
                  {r.value}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
