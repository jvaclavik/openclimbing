import styled from '@emotion/styled';
import { Skeleton, Typography } from '@mui/material';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { getCountryFlag } from '../../services/getCountryFlag';
import { intl, t } from '../../services/intl';
import {
  ClimbingArea,
  getClimbingAreas,
} from '../../services/climbing-areas/getClimbingAreas';
import type { ClimbingListType } from '../../services/climbing-areas/climbingListTypes';
import { Feature, TranslationId } from '../../services/types';
import { useFeatureContext } from '../utils/FeatureContext';
import { Bbox } from '../utils/MapStateContext';
import { tint } from '../utils/panelUi';
import { useVisibleBbox } from '../utils/useVisibleBbox';
import { GalleryWrapper } from './HomepageOpenClimbingGallery';

const LIMIT = 24;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const Card = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  background: ${({ theme }) => tint(theme, 0.03)};
  border: 1px solid ${({ theme }) => tint(theme, 0.12)};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover,
  &:focus {
    text-decoration: none;
    background: ${({ theme }) => tint(theme, 0.07)};
  }
`;

const Flag = styled.span`
  flex-shrink: 0;
  font-size: 1.2em;
  line-height: 1;
`;

const FallbackNote = styled.p`
  margin: 0 0 8px;
  padding: 0 4px;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 12px;
  line-height: 1.4;
`;

const COPY: Record<
  Exclude<ClimbingListType, 'rock'>,
  {
    fallback: TranslationId;
    empty: TranslationId;
  }
> = {
  ferrata: {
    fallback: 'homepage.gallery.nothing_in_viewport_ferrata',
    empty: 'climbingareas.no_ferratas',
  },
  gym: {
    fallback: 'homepage.gallery.nothing_in_viewport_gym',
    empty: 'climbingareas.no_gyms',
  },
};

const isInViewport = (item: ClimbingArea, bbox: Bbox) => {
  const [west, north, east, south] = bbox;
  return (
    item.lon >= west &&
    item.lon <= east &&
    item.lat >= south &&
    item.lat <= north
  );
};

const useVisibleItems = (listType: Exclude<ClimbingListType, 'rock'>) => {
  const bbox = useVisibleBbox();
  const { data, isLoading } = useQuery(
    ['climbingAreas', listType],
    () => getClimbingAreas(listType),
    { staleTime: 1000 * 60 * 60 },
  );

  return useMemo(() => {
    const all = data ?? [];
    const inViewport = bbox
      ? all.filter((item) => isInViewport(item, bbox))
      : all;
    const isFallback = inViewport.length === 0;
    return {
      items: (isFallback ? all : inViewport).slice(0, LIMIT),
      isFallback: isFallback && all.length > 0 && !!bbox,
      isLoading,
    };
  }, [data, bbox, isLoading]);
};

const PoiCard = ({ item }: { item: ClimbingArea }) => {
  const { setPreview } = useFeatureContext();
  const name = item.name || `N/A – ${item.osmType}/${item.osmId}`;

  return (
    <Card
      href={`/${item.osmType}/${item.osmId}`}
      locale={intl.lang}
      title={name}
      onMouseEnter={() =>
        setPreview({ center: [item.lon, item.lat] } as Feature)
      }
      onMouseLeave={() => setPreview(null)}
    >
      <Flag>{getCountryFlag(item.countryCode) || '🏳️'}</Flag>
      <Typography
        noWrap
        sx={{
          fontSize: '0.85rem',
          fontWeight: 700,
          lineHeight: 1.3,
        }}
      >
        {name}
      </Typography>
    </Card>
  );
};

export const HomepageNearbyPoiList = ({
  listType,
}: {
  listType: Exclude<ClimbingListType, 'rock'>;
}) => {
  const { items, isFallback, isLoading } = useVisibleItems(listType);
  const copy = COPY[listType];

  return (
    <GalleryWrapper>
      {isLoading && (
        <Grid>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              variant="rounded"
              height={42}
            />
          ))}
        </Grid>
      )}
      {!isLoading && isFallback && (
        <FallbackNote>{t(copy.fallback)}</FallbackNote>
      )}
      {!isLoading && items.length === 0 && (
        <FallbackNote>{t(copy.empty)}</FallbackNote>
      )}
      {!isLoading && items.length > 0 && (
        <Grid>
          {items.map((item) => (
            <PoiCard key={`${item.osmType}-${item.osmId}`} item={item} />
          ))}
        </Grid>
      )}
    </GalleryWrapper>
  );
};
