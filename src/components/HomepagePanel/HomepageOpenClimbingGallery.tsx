import styled from '@emotion/styled';
import { darken, Skeleton } from '@mui/material';
import Link from 'next/link';
import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { getCountryFlag } from '../../services/getCountryFlag';
import { intl, t } from '../../services/intl';
import {
  ClimbingGalleryItem,
  getClimbingGallery,
} from '../../services/climbing-areas/getClimbingGallery';
import { Feature } from '../../services/types';
import { convertHexToRgba } from '../utils/colorUtils';
import { useFeatureContext } from '../utils/FeatureContext';
import { Bbox } from '../utils/MapStateContext';
import {
  CommonsProgressiveImage,
  ProgressiveImageWrapper,
} from '../utils/ProgressiveImage';
import { useVisibleBbox } from '../utils/useVisibleBbox';

const GAP = 8;
const MIN_COLUMNS = 1; // the narrowest panel shows a single column
const MIN_COLUMN_WIDTH = 200; // a wider (resized) panel gets more columns
const ROW_HEIGHT = 6; // grid row unit – the finer, the tighter the masonry fits

const GALLERY_LIMIT = 24; // also the number of photos one "show more" adds
const MORE_TILE_HEIGHT = 48;
const PHOTO_WIDTH = 330; // tiles are ~150–200px wide, this covers retina too
const DEFAULT_RATIO = 4 / 3;

export const GalleryWrapper = styled.div`
  width: calc(100% + 32px * 2);
  margin: 0 -32px;
  padding: 0 12px;
`;

const getColumns = (width: number) =>
  Math.max(MIN_COLUMNS, Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP)));

const getColumnWidth = (width: number) => {
  const columns = getColumns(width);
  return (width - GAP * (columns - 1)) / columns;
};

const Grid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  grid-auto-rows: ${ROW_HEIGHT}px;
  grid-auto-flow: row dense;
  gap: ${GAP}px;
`;

const tileStyle = `
  position: relative;
  display: block;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
  line-height: 0;
`;

const Tile = styled(Link)`
  ${tileStyle}
  background-color: ${({ theme }) => theme.palette.background.elevation};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);

  ${ProgressiveImageWrapper} {
    width: 100%;
    height: 100%;
  }

  // dimming veil, the same way Pinterest reveals the actions on a pin
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    opacity: 0;
    pointer-events: none;
  }

  @media (hover: hover) {
    &:hover::after {
      opacity: 1;
    }
  }
`;

const Action = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: ${({ theme }) =>
    darken(theme.palette.background.searchBox, 0.15)};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  opacity: 0;
  pointer-events: none;

  @media (hover: hover) {
    ${Tile}:hover & {
      opacity: 1;
    }
  }
`;

const Gradient = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    0deg,
    ${convertHexToRgba('#303030', 0.85)} 0%,
    ${convertHexToRgba('#303030', 0.55)} 30%,
    transparent 70%
  );
`;

const Caption = styled.div`
  position: absolute;
  bottom: 10px;
  z-index: 1;
  width: 100%;
  padding: 0 10px;
  text-align: left;
`;

const Title = styled.h2`
  margin: 0;
  color: #fff;
  font-family: ${({ theme }) => theme.typography.h3.fontFamily};
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
  overflow-wrap: break-word;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
`;

const Subtitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  line-height: 1.8;
  text-transform: uppercase;
`;

const FallbackNote = styled.p`
  margin: 0 0 8px;
  padding: 0 4px;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 12px;
  line-height: 1.4;
`;

const useContainerWidth = (ref: RefObject<HTMLElement>) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    setWidth(element.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
};

// Bbox from MapStateContext is [west, north, east, south] (not GeoJSON order).
const isInViewport = (item: ClimbingGalleryItem, bbox: Bbox) => {
  const [west, north, east, south] = bbox;
  return (
    item.lon >= west &&
    item.lon <= east &&
    item.lat >= south &&
    item.lat <= north
  );
};

// Areas visible on the map, most drawn routes first. When the user looks at a
// place with no drawn areas we fall back to the global top, so the homepage
// never shows an empty gallery.
const useVisibleItems = (limit: number) => {
  const bbox = useVisibleBbox();
  const { data, isLoading } = useQuery(
    ['climbing-gallery'],
    getClimbingGallery,
    { staleTime: Infinity },
  );

  return useMemo(() => {
    const all = data ?? [];
    const inViewport = bbox
      ? all.filter((item) => isInViewport(item, bbox))
      : all;
    const isFallback = inViewport.length === 0;
    const matching = isFallback ? all : inViewport;
    return {
      items: matching.slice(0, limit),
      hiddenCount: Math.max(0, matching.length - limit),
      isFallback: isFallback && all.length > 0 && !!bbox,
      isLoading,
    };
  }, [data, bbox, isLoading, limit]);
};

type Tile = {
  item: ClimbingGalleryItem;
  rowSpan: number;
};

const spanStyle = ({ rowSpan }: Tile) => ({ gridRow: `span ${rowSpan}` });

const getRowSpan = (ratio: number, columnWidth: number) =>
  Math.max(1, Math.round((columnWidth / ratio + GAP) / (ROW_HEIGHT + GAP)));

const buildTiles = (items: ClimbingGalleryItem[], width: number): Tile[] => {
  const columnWidth = getColumnWidth(width);

  return items.map((item) => ({
    item,
    rowSpan: getRowSpan(item.photoRatio ?? DEFAULT_RATIO, columnWidth),
  }));
};

const GalleryItem = ({ tile }: { tile: Tile }) => {
  const { setPreview } = useFeatureContext();
  const { item } = tile;
  const onHover = () => setPreview({ center: [item.lon, item.lat] } as Feature); // TODO fix setPreview to accept only coordinates

  const label = `${t('homepage.openclimbing_climbing_area')} ${item.name}`;

  return (
    <Tile
      href={`/${item.osmType}/${item.osmId}`}
      locale={intl.lang}
      onMouseEnter={onHover}
      onMouseLeave={() => setPreview(null)}
      style={spanStyle(tile)}
      title={`${label} – ${t('homepage.gallery.drawn_on_photo', {
        count: item.routesOnPhoto,
      })}`}
    >
      <CommonsProgressiveImage
        photo={item.photo}
        width={PHOTO_WIDTH}
        alt={label}
      />
      <Action aria-hidden>{t('homepage.gallery.show_area')}</Action>
      <Gradient>
        <Caption>
          <Title>
            {item.name} {getCountryFlag(item.countryCode)}
          </Title>
          <Subtitle>
            {t('homepage.gallery.routes_count', { count: item.routeCount })}
          </Subtitle>
        </Caption>
      </Gradient>
    </Tile>
  );
};

// Spans all columns, so the dense masonry can only place it below the photos.
const MoreTile = styled.button`
  ${tileStyle}
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 0 16px;
  border: 1px dashed ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.background.elevation};
  color: ${({ theme }) => theme.palette.text.primary};
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
  }
`;

const MoreCount = styled.span`
  color: ${({ theme }) => theme.palette.primary.main};
  font-size: 18px;
  font-weight: 700;
`;

const ShowMoreTile = ({
  hiddenCount,
  onClick,
}: {
  hiddenCount: number;
  onClick: () => void;
}) => (
  <MoreTile
    type="button"
    onClick={onClick}
    style={{ gridRow: `span ${getRowSpan(1, MORE_TILE_HEIGHT)}` }}
  >
    <MoreCount>+{hiddenCount}</MoreCount>
    {t('homepage.gallery.show_more')}
  </MoreTile>
);

const SkeletonTile = styled(Skeleton)`
  ${tileStyle}
  transform: none;
`;

const GallerySkeleton = ({ width }: { width: number }) => {
  const columnWidth = getColumnWidth(width);
  const ratios = [4 / 3, 3 / 4, 3 / 4, 1, 4 / 3, 3 / 4, 1, 3 / 4];

  return (
    <Grid $columns={getColumns(width)}>
      {ratios.map((ratio, index) => (
        <SkeletonTile
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          variant="rectangular"
          style={{ gridRow: `span ${getRowSpan(ratio, columnWidth)}` }}
        />
      ))}
    </Grid>
  );
};

export const HomepageOpenClimbingGallery = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(wrapperRef);
  const [limit, setLimit] = useState(GALLERY_LIMIT);
  const { items, hiddenCount, isFallback, isLoading } = useVisibleItems(limit);

  const tiles = useMemo(
    () => (width > 0 ? buildTiles(items, width) : []),
    [items, width],
  );

  return (
    <GalleryWrapper ref={wrapperRef}>
      {(isLoading || !width) && <GallerySkeleton width={width || 360} />}
      {!isLoading && isFallback && (
        <FallbackNote>{t('homepage.gallery.nothing_in_viewport')}</FallbackNote>
      )}
      {!isLoading && !!width && (
        <Grid $columns={getColumns(width)}>
          {tiles.map((tile) => (
            <GalleryItem key={tile.item.osmId} tile={tile} />
          ))}
          {hiddenCount > 0 && (
            <ShowMoreTile
              hiddenCount={hiddenCount}
              onClick={() => setLimit((prev) => prev + GALLERY_LIMIT)}
            />
          )}
        </Grid>
      )}
    </GalleryWrapper>
  );
};
