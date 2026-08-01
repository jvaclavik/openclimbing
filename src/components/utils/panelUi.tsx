import styled from '@emotion/styled';
import { Skeleton, Theme, Typography } from '@mui/material';
import React from 'react';
import { useQuery } from 'react-query';
import { getClimbingStats } from '../../services/climbing-areas/getClimbingStats';
import { t } from '../../services/intl';
import type { ClimbingStatsResponse } from '../../types';

// panels sit on `background.default`, so surfaces stand out by a subtle tint
export const tint = (theme: Theme, strength: number) =>
  theme.palette.mode === 'dark'
    ? `rgba(255, 255, 255, ${strength})`
    : `rgba(0, 0, 0, ${strength})`;

export const TintedCard = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => tint(theme, 0.04)};
`;

export const IconBubble = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: ${({ theme }) => tint(theme, 0.06)};
  color: ${({ theme }) => theme.palette.primary.main};
`;

export const GradientHeading = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.h1.fontFamily};
  font-size: 40px;
  font-weight: 700;
  // the gradient is painted only within the box, so descenders sticking out of
  // a tight line box would be left transparent - hence the room below
  line-height: 1.2;
  padding-bottom: 0.08em;
  background: linear-gradient(
    120deg,
    ${({ theme }) => theme.palette.primary.main},
    ${({ theme }) => theme.palette.background.searchBox}
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

type SectionHeadingProps = {
  children: React.ReactNode;
  centered?: boolean;
};

export const SectionHeading = ({ children, centered }: SectionHeadingProps) => (
  <Typography
    variant="overline"
    component="h2"
    color="text.secondary"
    sx={{
      display: 'block',
      mb: 1.5,
      fontWeight: 700,
      letterSpacing: 1.5,
      textAlign: centered ? 'center' : 'left',
    }}
  >
    {children}
  </Typography>
);

export const useClimbingStats = (
  initialData?: ClimbingStatsResponse | null,
) => {
  const { data } = useQuery(['climbingStats'], getClimbingStats, {
    initialData: initialData ?? undefined,
    staleTime: 1000 * 60 * 60, // 1h – refreshed once a day at most
  });

  // the homepage panel is mounted on every route and shares this query key, so
  // it can create the cache entry first - without initialData. Falling back to
  // our own SSR data keeps the numbers in the server-rendered HTML.
  return data ?? initialData ?? undefined;
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const StatValue = styled.div`
  color: ${({ theme }) => theme.palette.primary.main};
  font-family: ${({ theme }) => theme.typography.h1.fontFamily};
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
`;

// grouping with a thin space is locale-agnostic, so server and client agree
const formatCount = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');

const Stat = ({ value, label }: { value?: number; label: string }) => (
  <TintedCard>
    <StatValue>
      {value === undefined ? <Skeleton width="70%" /> : formatCount(value)}
    </StatValue>
    <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
      {label}
    </Typography>
  </TintedCard>
);

export const ClimbingNumbers = ({
  stats,
}: {
  stats: ClimbingStatsResponse | null | undefined;
}) => (
  <StatsGrid>
    <Stat value={stats?.areasCount} label={t('stats.areas')} />
    <Stat value={stats?.routesCount} label={t('stats.routes')} />
    <Stat value={stats?.routesWithPhotoCount} label={t('stats.photos')} />
    <Stat value={stats?.countriesCount} label={t('stats.countries')} />
  </StatsGrid>
);
