import React, { useEffect, useMemo, useState } from 'react';
import Router, { useRouter } from 'next/router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Link from 'next/link';
import { useQuery } from 'react-query';
import {
  ClimbingArea,
  getClimbingAreas,
} from '../../services/climbing-areas/getClimbingAreas';
import type { ClimbingListType } from '../../services/climbing-areas/climbingListTypes';
import { intl, t } from '../../services/intl';
import { ClimbingListTypeTabs } from './ClimbingListTypeTabs';
import { ClimbingAreasFilter } from './ClimbingAreasFilter';
import {
  ClimbingAreasSort,
  ClimbingAreasSortBy,
  POI_SORT_OPTIONS,
  ROCK_SORT_OPTIONS,
} from './ClimbingAreasSort';
import { useClimbingListFilterSync } from './useClimbingListFilterSync';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';
import { Feature, TranslationId } from '../../services/types';
import { getCountryFlag, getCountryName } from '../../services/getCountryFlag';
import { PhotoCoverageRing } from '../FeaturePanel/Climbing/PhotoCoverageRing';
import { useFeatureContext } from '../utils/FeatureContext';
import { useMobileMode } from '../helpers';
import { Bbox, useMapStateContext } from '../utils/MapStateContext';
import { getClimbingGallery } from '../../services/climbing-areas/getClimbingGallery';
import {
  CommonsProgressiveImage,
  ProgressiveImageWrapper,
} from '../utils/ProgressiveImage';
import { tint } from '../utils/panelUi';
import { ViaFerrataScaleChip } from '../utils/ViaFerrataScaleChip';
import styled from '@emotion/styled';

type ClimbingAreasPanelProps = {
  items?: ClimbingArea[] | null;
  listType: ClimbingListType;
};

type SortBy = ClimbingAreasSortBy;

// Survives remounts when switching lezení / ferraty / stěny.
let sharedFilterViewport = false;
let sharedSortBy: SortBy | null = null;

const defaultSortFor = (listType: ClimbingListType): SortBy =>
  listType === 'rock' ? 'photos' : 'alphabetical';

const sortOptionsFor = (listType: ClimbingListType) =>
  listType === 'rock' ? ROCK_SORT_OPTIONS : POI_SORT_OPTIONS;

const resolveSortBy = (listType: ClimbingListType): SortBy => {
  const options = sortOptionsFor(listType);
  if (sharedSortBy && options.some((option) => option.value === sharedSortBy)) {
    return sharedSortBy;
  }
  return defaultSortFor(listType);
};

const LIST_COPY: Record<
  ClimbingListType,
  {
    title: TranslationId;
    count: TranslationId;
    empty: TranslationId;
    emptyViewport: TranslationId;
  }
> = {
  rock: {
    title: 'climbingareas.title',
    count: 'climbingareas.areas_count',
    empty: 'climbingareas.no_areas',
    emptyViewport: 'climbingareas.no_areas_in_viewport',
  },
  ferrata: {
    title: 'climbingareas.title_ferrata',
    count: 'climbingareas.ferratas_count',
    empty: 'climbingareas.no_ferratas',
    emptyViewport: 'climbingareas.no_ferratas_in_viewport',
  },
  gym: {
    title: 'climbingareas.title_gym',
    count: 'climbingareas.gyms_count',
    empty: 'climbingareas.no_gyms',
    emptyViewport: 'climbingareas.no_gyms_in_viewport',
  },
};

type CountryGroup = {
  countryCode: string | null;
  name: string;
  osmId: number;
  areas: ClimbingArea[];
  cragCount: number;
  routeCount: number;
  routesWithPhoto: number;
};

type SortableItem = {
  name: string | null;
  osmId: number;
  cragCount: number;
  routeCount: number;
  routesWithPhoto: number;
};

// Compares two items by the chosen key. `photos` (default): drawn routes desc;
// `routes`: total routes desc; `sectors`: sectors desc; `added`: OSM id desc
// (newer objects first); each falls back to the remaining counts and finally
// the name; `alphabetical`: name only.
const compareBy = (sortBy: SortBy) => (a: SortableItem, b: SortableItem) => {
  const byName = (a.name ?? '').localeCompare(b.name ?? '');
  if (sortBy === 'alphabetical') {
    return byName;
  }
  if (sortBy === 'added') {
    return b.osmId - a.osmId || byName;
  }
  if (sortBy === 'routes') {
    return b.routeCount - a.routeCount || b.cragCount - a.cragCount || byName;
  }
  if (sortBy === 'sectors') {
    return (
      b.cragCount - a.cragCount ||
      b.routesWithPhoto - a.routesWithPhoto ||
      byName
    );
  }
  return (
    b.routesWithPhoto - a.routesWithPhoto || b.cragCount - a.cragCount || byName
  );
};

// Bbox from MapStateContext is [west, north, east, south] (not GeoJSON order).
const isInViewport = (area: ClimbingArea, bbox: Bbox): boolean => {
  const [west, north, east, south] = bbox;
  return (
    area.lon >= west &&
    area.lon <= east &&
    area.lat >= south &&
    area.lat <= north
  );
};

// Groups areas by country and sorts both the areas inside each country and the
// countries themselves by the selected key (country uses summed values).
const groupByCountry = (
  areas: ClimbingArea[],
  sortBy: SortBy,
): CountryGroup[] => {
  const byCode = new Map<string, ClimbingArea[]>();
  for (const area of areas) {
    const key = area.countryCode ?? '';
    const list = byCode.get(key) ?? [];
    list.push(area);
    byCode.set(key, list);
  }

  const comparator = compareBy(sortBy);
  const groups = Array.from(byCode.entries()).map(([key, list]) => ({
    countryCode: key || null,
    name:
      getCountryName(key || null, intl.lang) ||
      t('climbingareas.unknown_country'),
    areas: [...list].sort(comparator),
    osmId: list.reduce((max, area) => Math.max(max, area.osmId), 0),
    cragCount: list.reduce((sum, area) => sum + area.cragCount, 0),
    routeCount: list.reduce((sum, area) => sum + area.routeCount, 0),
    routesWithPhoto: list.reduce((sum, area) => sum + area.routesWithPhoto, 0),
  }));

  return groups.sort(comparator);
};

const THUMB_WIDTH = 120; // rendered at 54px, so retina stays sharp

const Thumb = styled.div`
  width: 54px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background-color: ${({ theme }) => tint(theme, 0.06)};

  ${ProgressiveImageWrapper} {
    width: 100%;
    height: 100%;
  }
`;

// The gallery already knows the best photo of every area (the one with the most
// routes drawn on it) and the homepage keeps it cached under the same key.
const useAreaPhotos = () => {
  const { data } = useQuery(['climbing-gallery'], getClimbingGallery, {
    staleTime: Infinity,
  });

  return useMemo(
    () => new Map((data ?? []).map((item) => [item.osmId, item.photo])),
    [data],
  );
};

const AreaThumb = ({ photo, name }: { photo?: string; name: string }) => (
  <Thumb>
    {photo && (
      <CommonsProgressiveImage photo={photo} width={THUMB_WIDTH} alt={name} />
    )}
  </Thumb>
);

const CountryAccordion = ({
  group,
  defaultExpanded,
  backTarget,
  listType,
}: {
  group: CountryGroup;
  defaultExpanded: boolean;
  backTarget: string;
  listType: ClimbingListType;
}) => {
  const { countryCode, name: countryName, areas, cragCount } = group;
  const { setPreview } = useFeatureContext();
  const mobileMode = useMobileMode();
  const photos = useAreaPhotos();
  const isRock = listType === 'rock';
  const copy = LIST_COPY[listType];

  const handleHover = (area: ClimbingArea) => () => {
    setPreview({ center: [area.lon, area.lat] } as Feature);
  };

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      slotProps={{ transition: { timeout: 120 } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: '1.3em' }}>
              {getCountryFlag(countryCode) || '🏳️'}
            </span>
            <Typography
              noWrap
              sx={{
                fontWeight: 600,
              }}
            >
              {countryName}
            </Typography>
          </Box>
          <Box
            sx={{
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {t(copy.count, { count: areas.length })}
            </Typography>
            {isRock && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('climbingareas.crags_count', { count: cragCount })}
              </Typography>
            )}
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={1} />
              {isRock && <TableCell width={1} />}
              <TableCell>{t('climbingareas.col_name')}</TableCell>
              {isRock && (
                <>
                  <TableCell align="right">
                    {t('climbingareas.col_routes')}
                  </TableCell>
                  <TableCell align="right">
                    {t('climbingareas.col_sectors')}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {areas.map((area, index) => (
              <TableRow
                key={`${area.osmType}-${area.osmId}`}
                hover
                onMouseEnter={mobileMode ? undefined : handleHover(area)}
                onMouseLeave={mobileMode ? undefined : () => setPreview(null)}
              >
                <TableCell width={1}>{index + 1}.</TableCell>
                {isRock && (
                  <TableCell width={1} sx={{ pr: 0 }}>
                    <AreaThumb
                      photo={photos.get(area.osmId)}
                      name={area.name ?? ''}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 0,
                    }}
                  >
                    <Link
                      href={`/${area.osmType}/${area.osmId}?back=${backTarget}`}
                      locale={intl.lang}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {area.name || `N/A – ${area.osmType}/${area.osmId}`}
                    </Link>
                    {area.viaFerrataScale && (
                      <ViaFerrataScaleChip scale={area.viaFerrataScale} />
                    )}
                    {area.city && (
                      <Typography
                        noWrap
                        component="span"
                        title={area.city}
                        sx={{
                          flexShrink: 0,
                          maxWidth: '40%',
                          fontSize: '0.8rem',
                          color: 'text.secondary',
                        }}
                      >
                        {area.city}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                {isRock && (
                  <>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 0.75,
                        }}
                      >
                        {area.routeCount > 0 && (
                          <PhotoCoverageRing
                            total={area.routeCount}
                            withPhoto={area.routesWithPhoto}
                          />
                        )}
                        <span>{area.routeCount}</span>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{area.cragCount}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
};

export const ClimbingAreasPanel = ({
  items,
  listType,
}: ClimbingAreasPanelProps) => {
  const router = useRouter();
  const isMobileMode = useMobileMode();
  const { bbox } = useMapStateContext();
  const { setPreview } = useFeatureContext();
  const copy = LIST_COPY[listType];
  const sortOptions = sortOptionsFor(listType);
  const [sortBy, setSortBy] = useState<SortBy>(() => resolveSortBy(listType));
  const [filterViewport, setFilterViewport] = useState(sharedFilterViewport);
  useClimbingListFilterSync(listType);

  useEffect(() => {
    setSortBy(resolveSortBy(listType));
  }, [listType]);

  // `items` is filled on SSR (direct visit / crawlers) and passed as initialData
  // so the list is rendered straight into the HTML. On in-app navigation `items`
  // is null and react-query fetches it on the client (and caches it).
  const { data, isLoading, isError } = useQuery(
    ['climbingAreas', listType],
    () => getClimbingAreas(listType),
    {
      initialData: items ?? undefined,
      staleTime: 1000 * 60 * 60, // 1h – the list changes rarely
    },
  );

  const handleClose = () => {
    Router.push(`/`);
  };

  // Clear the hover pin when leaving the panel so it doesn't stay on the map.
  useEffect(() => () => setPreview(null), [setPreview]);

  const visibleAreas = useMemo(() => {
    const allAreas = data ?? [];
    if (!filterViewport || !bbox) return allAreas;
    return allAreas.filter((area) => isInViewport(area, bbox));
  }, [data, filterViewport, bbox]);

  const groups = useMemo(
    () => groupByCountry(visibleAreas, sortBy),
    [visibleAreas, sortBy],
  );
  const backTarget = encodeURIComponent(router.asPath);

  const body = (
    <>
      <PanelSidePadding>
        <ClosePanelButton right onClick={handleClose} />
        <h1>{t(copy.title)}</h1>
        <ClimbingListTypeTabs listType={listType} />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: -0.5,
            mb: 0.5,
            mr: -1,
          }}
        >
          <ClimbingAreasSort
            sortBy={sortBy}
            onSortByChange={(value) => {
              sharedSortBy = value;
              setSortBy(value);
            }}
            options={sortOptions}
            isDefault={sortBy === defaultSortFor(listType)}
          />
          <ClimbingAreasFilter
            filterViewport={filterViewport}
            onFilterViewportChange={(checked) => {
              sharedFilterViewport = checked;
              setFilterViewport(checked);
            }}
          />
        </Stack>
        {data && groups.length === 0 && (
          <Typography
            sx={{
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {t(filterViewport ? copy.emptyViewport : copy.empty)}
          </Typography>
        )}
      </PanelSidePadding>

      {data ? (
        groups.map((group) => (
          <CountryAccordion
            key={group.countryCode ?? 'unknown'}
            group={group}
            defaultExpanded={false}
            backTarget={backTarget}
            listType={listType}
          />
        ))
      ) : isError ? (
        <PanelSidePadding>
          <Typography color="error" variant="body2">
            {t('error')}
          </Typography>
        </PanelSidePadding>
      ) : (
        isLoading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
              }}
            >
              <CircularProgress color="secondary" />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('loading')}
              </Typography>
            </Stack>
          </Box>
        )
      )}
    </>
  );

  return (
    <MobilePageDrawer className="climbing-areas-drawer">
      <PanelContent $grow={isMobileMode}>
        {isMobileMode ? body : <PanelScrollbars>{body}</PanelScrollbars>}
      </PanelContent>
    </MobilePageDrawer>
  );
};
