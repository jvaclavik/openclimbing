import styled from '@emotion/styled';
import Link from 'next/link';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { intl, t } from '../../services/intl';
import { Feature, LonLat } from '../../services/types';
import { convertHexToRgba } from '../utils/colorUtils';
import { useFeatureContext } from '../utils/FeatureContext';

const COLUMN_GAP = 8;
const COLUMN_MIN_WIDTH = 145;
const MAX_COLUMNS = 4;
const DEFAULT_COLUMNS = 2;

type GalleryItemType = {
  href: string;
  src: string;
  label: string;
  center: LonLat;
  width: number;
  height: number;
};

const data: GalleryItemType[] = [
  {
    href: '/relation/17262675',
    src: '/images/homepage/hlubocepske-plotny',
    label: 'Hlubočepské plotny 🇨🇿',
    center: [14.3927293, 50.0441017],
    width: 242,
    height: 200,
  },
  {
    href: '/relation/17696060',
    src: '/images/homepage/frankenjura',
    label: 'Frankenjura 🇩🇪',
    center: [11.3682785, 49.7465462],
    width: 149,
    height: 200,
  },
  {
    href: '/relation/17470613',
    src: '/images/homepage/alkazar',
    label: 'Alkazar 🇨🇿',
    center: [14.1244611, 49.950313],
    width: 267,
    height: 200,
  },
  {
    href: '/relation/19250793',
    src: '/images/homepage/sokoliki',
    label: 'Sokoliki 🇵🇱',
    center: [15.8679484, 50.8674463],
    width: 150,
    height: 200,
  },
  {
    href: '/relation/14297763',
    src: '/images/homepage/velka',
    label: 'Velká (Vltavská žula) 🇨🇿',
    center: [14.2516807, 49.6666024],
    width: 268,
    height: 200,
  },
  {
    href: '/relation/18501782',
    src: '/images/homepage/geyikbayiri',
    label: 'Geyikbayırı 🇹🇷',
    center: [30.4868349, 36.8754952],
    width: 268,
    height: 200,
  },
  {
    href: '/relation/17130099',
    src: '/images/homepage/roviste',
    label: 'Roviště 🇨🇿',
    center: [14.2556371, 49.660973],
    width: 269,
    height: 200,
  },
  {
    href: '/relation/19257709',
    src: '/images/homepage/szklarska-poreba',
    label: 'Szklarska Poręba 🇵🇱',
    center: [15.5108783, 50.8266512],
    width: 149,
    height: 200,
  },
  {
    href: '/relation/18647139',
    src: '/images/homepage/san-bartolo',
    label: 'San Bartolo 🇪🇸',
    center: [-5.7209517, 36.0889594],
    width: 150,
    height: 200,
  },
  {
    href: '/relation/18452584',
    src: '/images/homepage/rochlitz',
    label: 'Rochlitz 🇩🇪',
    center: [12.7719492, 51.0273325],
    width: 258,
    height: 200,
  },
  {
    href: '/relation/18478296',
    src: '/images/homepage/timpa-rossa',
    label: 'Timpa Rossa 🇮🇹',
    center: [14.9483232, 36.8386582],
    width: 150,
    height: 200,
  },
  {
    href: '/relation/18218704',
    src: '/images/homepage/rastenfeld',
    label: 'Rastenfeld 🇦🇹',
    center: [15.3213433, 48.566838],
    width: 163,
    height: 200,
  },
  {
    href: '/relation/17142287',
    src: '/images/homepage/lomy-nad-velkou',
    label: 'Lomy nad Velkou 🇨🇿',
    center: [14.2511312, 49.652123],
    width: 148,
    height: 200,
  },
  {
    href: '/relation/17400318',
    src: '/images/homepage/kobyla',
    label: 'Kobyla 🇨🇿',
    center: [14.0806949, 49.9136053],
    width: 165,
    height: 200,
  },
  {
    href: '/relation/18286650',
    src: '/images/homepage/ratao',
    label: 'Ratão 🇵🇹',
    center: [-8.2314618, 41.0469073],
    width: 269,
    height: 200,
  },
  {
    href: '/relation/14297668',
    src: '/images/homepage/jickovice',
    label: 'Jickovice 🇨🇿',
    center: [14.1955833, 49.4537897],
    width: 150,
    height: 200,
  },
  {
    href: '/relation/17301396',
    src: '/images/homepage/tetinske-skaly',
    label: 'Tetínské skály 🇨🇿',
    center: [14.1077375, 49.9496788],
    width: 148,
    height: 200,
  },
  {
    href: '/relation/17416413',
    src: '/images/homepage/solvayovy-lomy',
    label: 'Solvayovy lomy 🇨🇿',
    center: [14.1446707, 49.9725761],
    width: 269,
    height: 200,
  },
  {
    href: '/relation/17399801',
    src: '/images/homepage/u-zidovy-strouhy',
    label: 'U Židovy strouhy 🇨🇿',
    center: [14.4631705, 49.2822267],
    width: 251,
    height: 200,
  },
];

const DISCOVER_MORE_TILE: GalleryItemType = {
  href: '/climbing-areas',
  src: '/images/homepage/solvayovy-lomy',
  label: '',
  center: undefined,
  width: 269,
  height: 200,
};

export const GalleryWrapper = styled.div`
  width: calc(100% + 32px * 2);
  margin: 32px -32px 8px -32px;
  padding: 0 12px;
`;

const Columns = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${COLUMN_GAP}px;
`;

const Column = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${COLUMN_GAP}px;
  min-width: 0;
`;

const Tile = styled(Link)`
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 10px;
  line-height: 0;
  background-color: ${({ theme }) => theme.palette.background.elevation};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition:
    box-shadow 0.2s,
    transform 0.2s;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  &:hover img {
    transform: scale(1.06);
  }
`;

const Gradient = styled.div<{ $blur?: boolean }>`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  transition: all 0.2s;
  ${({ $blur }) =>
    $blur
      ? `-webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  background: ${convertHexToRgba('#303030', 0.2)};
  `
      : `background: linear-gradient(
    0deg,
    ${convertHexToRgba('#303030', 0.75)} 5%,
    transparent 55%
  );`}
`;

const Text = styled.h2<{ $center?: boolean }>`
  position: absolute;
  bottom: 8px;
  width: 100%;
  padding: 0 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1.5px;
  line-height: 1.3;
  text-align: center;
  text-transform: uppercase;
  ${({ $center }) => $center === true && `top: 40%`};
`;

const DiscoverMoreText = styled.div`
  margin-bottom: 4px;
  font-weight: normal;
  line-height: 2;
  text-transform: lowercase;
`;

const useColumnCount = (ref: RefObject<HTMLElement>) => {
  const [columnCount, setColumnCount] = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const update = (width: number) => {
      const fitting = Math.floor(
        (width + COLUMN_GAP) / (COLUMN_MIN_WIDTH + COLUMN_GAP),
      );
      setColumnCount(Math.min(MAX_COLUMNS, Math.max(2, fitting)));
    };

    update(element.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      update(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return columnCount;
};

// greedy masonry – each item goes to the currently shortest column
const splitIntoColumns = (items: GalleryItemType[], columnCount: number) => {
  const columns: GalleryItemType[][] = Array.from(
    { length: columnCount },
    () => [],
  );
  const heights = new Array(columnCount).fill(0);

  items.forEach((item) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += item.height / item.width;
  });

  return columns;
};

const GalleryItem = ({ item }: { item: GalleryItemType }) => {
  const { setPreview } = useFeatureContext();
  const onHover = () => setPreview({ center: item.center } as Feature); // TODO fix setPreview to accept only coordinates

  return (
    <Tile
      href={item.href}
      locale={intl.lang}
      onMouseEnter={onHover}
      style={{ aspectRatio: `${item.width} / ${item.height}` }}
    >
      <img
        src={`${item.src}.jpg`}
        srcSet={`${item.src}.jpg, ${item.src}-2.jpg 2x`}
        loading="lazy"
        alt={`${t('homepage.openclimbing_climbing_area')} ${item.label}`}
        title={`${t('homepage.openclimbing_climbing_area')} ${item.label}`}
      />
      <Gradient>
        <Text>{item.label}</Text>
      </Gradient>
    </Tile>
  );
};

const DiscoverMoreItem = () => (
  <Tile
    href={DISCOVER_MORE_TILE.href}
    locale={intl.lang}
    style={{
      aspectRatio: `${DISCOVER_MORE_TILE.width} / ${DISCOVER_MORE_TILE.height}`,
    }}
  >
    <img src={`${DISCOVER_MORE_TILE.src}.jpg`} loading="lazy" alt="" />
    <Gradient $blur>
      <Text $center>
        <DiscoverMoreText>{t('homepage.discover_more_p1')}</DiscoverMoreText>
        700+ {t('homepage.discover_more_p2')}
      </Text>
    </Gradient>
  </Tile>
);

export const HomepageOpenClimbingGallery = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const columnCount = useColumnCount(wrapperRef);
  const columns = splitIntoColumns([...data, DISCOVER_MORE_TILE], columnCount);

  return (
    <GalleryWrapper ref={wrapperRef}>
      <Columns>
        {columns.map((column, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Column key={index}>
            {column.map((item) =>
              item === DISCOVER_MORE_TILE ? (
                <DiscoverMoreItem key="discover-more" />
              ) : (
                <GalleryItem key={item.href} item={item} />
              ),
            )}
          </Column>
        ))}
      </Columns>
    </GalleryWrapper>
  );
};
