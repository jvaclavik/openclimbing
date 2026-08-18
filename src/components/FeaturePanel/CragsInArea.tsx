import styled from '@emotion/styled';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, Chip, Stack, Typography } from '@mui/material';
import Router from 'next/router';
import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { getHumanPoiType, getLabel } from '../../helpers/featureLabel';
import { getOsmappLink, getShortId, getUrlOsmId } from '../../services/helpers';
import { addFeatureCenterToCache } from '../../services/osm/featureCenterToCache';
import { Feature, isInstant } from '../../services/types';
import { ClientOnly, useMobileMode } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { PANEL_GAP, PanelSidePadding } from '../utils/PanelHelpers';
import { tint } from '../utils/panelUi';

import Link from 'next/link';
import { getInstantImage } from '../../services/images/getImageDefs';
import { intl, t } from '../../services/intl';
import { CragsInAreaSort } from './Climbing/CragsInAreaSort/CragsInAreaSort';
import { useCragsInAreaSort } from './Climbing/CragsInAreaSort/utils/useCragsInAreaSort';
import { CragsInAreaFilter } from './Climbing/Filter/CragsInAreaFilter';
import {
  useGetFilteredCrags,
  useGetMemberCrags,
} from './Climbing/Filter/utils/useGetFilteredCrags';
import { PanelLabel } from './Climbing/PanelLabel';
import { PhotoCoverageRing } from './Climbing/PhotoCoverageRing';
import { RouteDistribution } from './Climbing/RouteDistribution';
import { naturalSort } from './Climbing/utils/array';
import { hasPathOnPhoto } from './Climbing/utils/photo';
import { Slider, Wrapper } from './FeatureImages/FeatureImages';
import { getClickHandler } from './FeatureImages/Image/helpers';
import { Image } from './FeatureImages/Image/Image';
import { MemberItem } from './MemberFeatures/MemberItem';

const MAX_CRAG_CARD_IMAGES = 3;

const findScrollParent = (el: HTMLElement | null): HTMLElement | undefined => {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
    node = node.parentElement;
  }
  return undefined;
};

type ListItem =
  | { kind: 'area'; feature: Feature }
  | { kind: 'crag'; feature: Feature }
  | { kind: 'other'; feature: Feature };

const ArrowIcon = styled(ArrowForwardIosIcon)`
  align-self: center;
  font-size: 11px;
  opacity: 0.35;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
`;

const CARD_GAP = '12px';

// Each crag is a surface of its own – with a dozen of them in an area, plain
// stacked blocks read as one long wall of text.
const Container = styled.div<{ $isArea?: boolean }>`
  --content-gap: ${CARD_GAP};
  padding: ${CARD_GAP} 0;
  border-radius: 12px;
  overflow: hidden;
  background-color: ${({ theme }) => tint(theme, 0.035)};
  transition: background-color 0.15s ease;

  // sub-areas are signposts, not destinations – the accent sets them apart
  ${({ $isArea, theme }) =>
    $isArea && `border-left: 3px solid ${theme.palette.primary.main};`}

  @media (hover: hover) {
    &:hover {
      background-color: ${({ theme }) => tint(theme, 0.07)};
    }
  }
`;

const InnerContainer = styled.div`
  overflow: auto;
  flex-direction: column;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    ${ArrowIcon} {
      opacity: 1;
      transform: translateX(2px);
    }
  }
`;

const CragListContainer = styled.div`
  margin-top: 12px;
  padding: 0 ${PANEL_GAP};
  min-height: 1px;
`;

const ListRow = styled.div`
  padding-bottom: 12px;
`;

const CragName = styled.div`
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

// No underline on the heading – the whole card is the target, and its hover
// tint already says so. Underlining just the text would point at the text.
const StyledLink = styled(Link)`
  text-decoration: none !important;
`;

const ChipContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 12px;
  white-space: nowrap;
`;

const TypeLabel = styled.span`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Header = ({
  label,
  chipContent,
  typeLabel,
  withArrow,
}: {
  label: string;
  chipContent?: React.ReactNode;
  typeLabel?: string;
  withArrow?: boolean;
}) => (
  <PanelSidePadding>
    <CragName>
      <Box display="flex" alignItems="baseline" gap={1} overflow="hidden">
        <Typography
          variant="h4"
          component="h3"
          overflow="hidden"
          textOverflow="ellipsis"
          color="primary"
          lineHeight={1.2}
        >
          {label}
        </Typography>
        {typeLabel && <TypeLabel>{typeLabel}</TypeLabel>}
        {withArrow && <ArrowIcon color="secondary" />}
      </Box>
      {chipContent}
    </CragName>
  </PanelSidePadding>
);

const AreaInfo = ({
  crags,
  subAreas,
}: {
  crags: Feature[];
  subAreas: Feature[];
}) => {
  const { feature } = useFeatureContext();
  const numberOfRoutes =
    crags.reduce((acc, { memberFeatures }) => {
      return acc + (memberFeatures?.length ?? 0);
    }, 0) +
    subAreas.reduce((acc, subArea) => acc + countRoutesInArea(subArea), 0);
  const routesWithPhoto =
    crags.reduce(
      (acc, { memberFeatures }) => acc + countRoutesWithPhoto(memberFeatures),
      0,
    ) +
    subAreas.reduce(
      (acc, subArea) => acc + countRoutesWithPhotoInArea(subArea),
      0,
    );
  const totalItems = crags.length + subAreas.length;

  return (
    <PanelLabel
      addition={
        totalItems >= 2 ? (
          <NumberOfVisible
            crags={crags.length}
            areas={subAreas.length}
            routes={numberOfRoutes}
            routesWithPhoto={routesWithPhoto}
          />
        ) : null
      }
    >
      {t('featurepanel.climbing_sectors')}{' '}
      {feature.tags.name
        ? `${t('featurepanel.climbing_sectors_in')} ${feature.tags.name}`
        : ''}
    </PanelLabel>
  );
};

const Gallery = ({ images, feature }) => {
  const poiType = getHumanPoiType(feature);
  const alt = `${poiType} ${getLabel(feature)}`;

  return (
    <Wrapper>
      <Slider>
        {naturalSort(images, (item) => item.def.k).map((item, index) => {
          const owner = item.owner ?? feature;
          const openTopo = getClickHandler(owner, item.def);
          return (
            <Image
              key={item.image.imageUrl}
              def={item.def}
              image={item.image}
              alt={`${alt} ${index + 1}`}
              onClick={openTopo}
              actionLabel={
                openTopo ? t('featurepanel.photo_show_topo') : undefined
              }
            />
          );
        })}
      </Slider>
    </Wrapper>
  );
};

const getFeatureImages = (feature: Feature, limit = MAX_CRAG_CARD_IMAGES) =>
  (
    feature?.imageDefs?.filter(isInstant)?.map((def) => ({
      def,
      image: getInstantImage(def),
      owner: feature,
    })) ?? []
  ).slice(0, limit);

const countRoutesInArea = (feature: Feature): number =>
  (feature.memberFeatures ?? []).reduce((acc, child) => {
    if (child.tags.climbing === 'crag') {
      return acc + (child.memberFeatures?.length ?? 0);
    }
    if (child.tags.climbing === 'area') {
      return acc + countRoutesInArea(child);
    }
    return acc;
  }, 0);

const countRoutesWithPhoto = (routes: Feature[] = []): number =>
  routes.filter((route) => hasPathOnPhoto(route.tags)).length;

const countRoutesWithPhotoInArea = (feature: Feature): number =>
  (feature.memberFeatures ?? []).reduce((acc, child) => {
    if (child.tags.climbing === 'crag') {
      return acc + countRoutesWithPhoto(child.memberFeatures);
    }
    if (child.tags.climbing === 'area') {
      return acc + countRoutesWithPhotoInArea(child);
    }
    return acc;
  }, 0);

const collectAreaImages = (feature: Feature, limit = 20) => {
  const ownImages = getFeatureImages(feature);
  const childImages = (feature.memberFeatures ?? []).flatMap((child) =>
    getFeatureImages(child),
  );
  return [...ownImages, ...childImages].slice(0, limit);
};

const CragItem = ({
  feature,
  showTypeLabel,
}: {
  feature: Feature;
  showTypeLabel?: boolean;
}) => {
  const mobileMode = useMobileMode();
  const { setPreview } = useFeatureContext();
  const handleHover = () => feature.center && setPreview(feature);

  const images = getFeatureImages(feature);

  const getOnClickWithHash = (e) => {
    e.preventDefault();
    if (feature.center) {
      // seed the center so fetchFeature() skips the slow Overpass center query
      addFeatureCenterToCache(getShortId(feature.osmMeta), feature.center);
    }
    Router.push(`/${getUrlOsmId(feature.osmMeta)}${window.location.hash}`);
  };

  return (
    <Container>
      <StyledLink
        href={`/${getUrlOsmId(feature.osmMeta)}`}
        locale={intl.lang}
        onClick={getOnClickWithHash}
        onMouseEnter={mobileMode ? undefined : handleHover}
        onMouseLeave={() => setPreview(null)}
        title={`${t('featurepanel.sector')} ${getLabel(feature)}`}
      >
        <InnerContainer>
          <Header
            label={getLabel(feature)}
            chipContent={
              feature.members?.length ? (
                <ChipContent>
                  <span>
                    <strong>{feature.members.length}</strong>{' '}
                    {t('featurepanel.routes')}
                  </span>
                  <PhotoCoverageRing
                    total={feature.members.length}
                    withPhoto={countRoutesWithPhoto(feature.memberFeatures)}
                  />
                </ChipContent>
              ) : undefined
            }
            typeLabel={showTypeLabel ? t('featurepanel.type_crag') : undefined}
          />
          {images.length ? <Gallery feature={feature} images={images} /> : null}
        </InnerContainer>
      </StyledLink>
      {feature.memberFeatures.length > 0 && (
        <RouteDistribution
          features={feature.memberFeatures}
          variant="compact"
        />
      )}
    </Container>
  );
};

const AreaItem = ({ feature }: { feature: Feature }) => {
  const mobileMode = useMobileMode();
  const { setPreview } = useFeatureContext();
  const handleHover = () => feature.center && setPreview(feature);

  const images = collectAreaImages(feature);
  const cragCount =
    feature.memberFeatures?.filter(({ tags }) => tags.climbing === 'crag')
      .length ?? 0;
  const subAreaCount =
    feature.memberFeatures?.filter(({ tags }) => tags.climbing === 'area')
      .length ?? 0;

  const routeCount = countRoutesInArea(feature);
  const hasAnyCount = subAreaCount > 0 || cragCount > 0 || routeCount > 0;
  const chipContent = hasAnyCount ? (
    <ChipContent>
      <CountSummary
        areas={subAreaCount}
        crags={cragCount}
        routes={routeCount}
      />
      {routeCount > 0 && (
        <PhotoCoverageRing
          total={routeCount}
          withPhoto={countRoutesWithPhotoInArea(feature)}
        />
      )}
    </ChipContent>
  ) : undefined;

  const getOnClickWithHash = (e) => {
    e.preventDefault();
    if (feature.center) {
      // seed the center so fetchFeature() skips the slow Overpass center query
      addFeatureCenterToCache(getShortId(feature.osmMeta), feature.center);
    }
    Router.push(`/${getUrlOsmId(feature.osmMeta)}${window.location.hash}`);
  };

  return (
    <Container $isArea>
      <StyledLink
        href={`/${getUrlOsmId(feature.osmMeta)}`}
        locale={intl.lang}
        onClick={getOnClickWithHash}
        onMouseEnter={mobileMode ? undefined : handleHover}
        onMouseLeave={() => setPreview(null)}
        title={`${t('featurepanel.area')} ${getLabel(feature)}`}
      >
        <InnerContainer>
          <Header
            label={getLabel(feature)}
            chipContent={chipContent}
            typeLabel={t('featurepanel.type_area')}
            withArrow
          />
          {images.length ? <Gallery feature={feature} images={images} /> : null}
        </InnerContainer>
      </StyledLink>
    </Container>
  );
};

const CragList = ({
  crags,
  subAreas,
}: {
  crags: Feature[];
  subAreas: Feature[];
}) => {
  const { feature } = useFeatureContext();
  const hasMixed = subAreas.length > 0 && crags.length > 0;

  const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>();

  const setListEl = (el: HTMLDivElement | null) => {
    setScrollParent(el ? findScrollParent(el) : undefined);
  };

  const items = useMemo<ListItem[]>(() => {
    const otherFeatures = feature.memberFeatures.filter(
      ({ tags }) => tags.climbing !== 'crag' && tags.climbing !== 'area',
    );
    return [
      ...subAreas.map((f) => ({ kind: 'area' as const, feature: f })),
      ...crags.map((f) => ({ kind: 'crag' as const, feature: f })),
      ...otherFeatures.map((f) => ({ kind: 'other' as const, feature: f })),
    ];
  }, [crags, feature.memberFeatures, subAreas]);

  return (
    <Box mt={2} mb={4}>
      <CragListContainer ref={setListEl}>
        {scrollParent && items.length > 0 ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={items}
            increaseViewportBy={{ top: 1200, bottom: 1600 }}
            defaultItemHeight={160}
            computeItemKey={(index, item) =>
              `${item.kind}-${getOsmappLink(item.feature)}-${index}`
            }
            itemContent={(_index, item) => (
              <ListRow>
                {item.kind === 'area' && <AreaItem feature={item.feature} />}
                {item.kind === 'crag' && (
                  <CragItem feature={item.feature} showTypeLabel={hasMixed} />
                )}
                {item.kind === 'other' && <MemberItem feature={item.feature} />}
              </ListRow>
            )}
          />
        ) : null}
      </CragListContainer>
    </Box>
  );
};

const CountSummary = (props: {
  crags: number;
  areas: number;
  routes: number;
}) => {
  const parts: React.ReactNode[] = [];
  if (props.areas > 0) {
    parts.push(
      <>
        <strong>{props.areas}</strong> {t('featurepanel.areas')}
      </>,
    );
  }
  if (props.crags > 0) {
    parts.push(
      <>
        <strong>{props.crags}</strong> {t('featurepanel.sectors')}
      </>,
    );
  }
  if (props.routes > 0) {
    parts.push(
      <>
        <strong>{props.routes}</strong> {t('featurepanel.routes')}
      </>,
    );
  }
  if (parts.length === 0) {
    return null;
  }
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && ', '}
          {part}
        </React.Fragment>
      ))}
    </>
  );
};

const NumberOfVisible = (props: {
  crags: number;
  areas: number;
  routes: number;
  routesWithPhoto: number;
}) => {
  if (props.areas === 0 && props.crags === 0 && props.routes === 0) {
    return null;
  }
  return (
    <Chip
      size="small"
      variant="outlined"
      label={
        <ChipContent>
          <CountSummary
            crags={props.crags}
            areas={props.areas}
            routes={props.routes}
          />
          {props.routes > 0 && (
            <PhotoCoverageRing
              total={props.routes}
              withPhoto={props.routesWithPhoto}
            />
          )}
        </ChipContent>
      }
      sx={{ position: 'relative', top: 2, fontWeight: 'normal' }}
    />
  );
};

const NumberOfHiddenCrags = ({ crags }: { crags: Feature[] }) => {
  const unfilteredCrags = useGetMemberCrags();
  const numberOfHiddenCrags = unfilteredCrags.length - crags.length;
  if (!numberOfHiddenCrags) {
    return null;
  }

  return (
    <ClientOnly>
      <Typography variant="caption" color="secondary" sx={{ paddingRight: 2 }}>
        <strong>{numberOfHiddenCrags}</strong> {t('featurepanel.hidden_crags')}
      </Typography>
    </ClientOnly>
  );
};

const AllCragsDistribution = ({ crags }: { crags: Feature[] }) => {
  const allCragRoutes = crags.reduce((acc, { memberFeatures }) => {
    return [...acc, ...memberFeatures];
  }, []);

  if (crags.length >= 2) {
    return <RouteDistribution features={allCragRoutes} gradePicker="label" />;
  }
  return null;
};

const FilterRow: React.FC = ({ children }) => (
  <Stack
    direction="row"
    spacing={0.5}
    justifyContent="flex-end"
    m={1}
    alignItems="center"
  >
    {children}
  </Stack>
);

const useGetMemberAreas = () => {
  const { feature } = useFeatureContext();
  return feature.memberFeatures.filter(({ tags }) => tags.climbing === 'area');
};

const CragsInAreaInner = () => {
  const { sortByFn, sortBy, setSortBy } = useCragsInAreaSort();
  const unfilteredCrags = useGetMemberCrags();
  const crags = useGetFilteredCrags(unfilteredCrags).sort(sortByFn(sortBy));
  const unfilteredSubAreas = useGetMemberAreas();
  const subAreas = useGetFilteredCrags(unfilteredSubAreas).sort(
    sortByFn(sortBy),
  );

  return (
    <>
      {unfilteredCrags.length >= 2 && (
        <FilterRow>
          <NumberOfHiddenCrags crags={crags} />
          <CragsInAreaSort setSortBy={setSortBy} sortBy={sortBy} />
          <CragsInAreaFilter />
        </FilterRow>
      )}
      <AllCragsDistribution crags={crags} />
      <AreaInfo crags={crags} subAreas={subAreas} />
      <CragList crags={crags} subAreas={subAreas} />
    </>
  );
};

export const CragsInArea = () => {
  const { feature } = useFeatureContext();
  if (feature.tags.climbing !== 'area' || !feature.memberFeatures?.length) {
    return null;
  }

  return <CragsInAreaInner />;
};
