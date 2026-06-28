import styled from '@emotion/styled';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { getHumanPoiType, getLabel } from '../../helpers/featureLabel';
import {
  getOsmappLink,
  getReactKey,
  getShortId,
  getUrlOsmId,
} from '../../services/helpers';
import { addFeatureCenterToCache } from '../../services/osm/featureCenterToCache';
import { Feature, isInstant } from '../../services/types';
import { ClientOnly, isMobileMode, useMobileMode } from '../helpers';
import { useFeatureContext } from '../utils/FeatureContext';

import Link from 'next/link';
import { getInstantImage } from '../../services/images/getImageDefs';
import { intl, t } from '../../services/intl';
import { PROJECT_ID } from '../../services/project';
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

const isOpenClimbing = PROJECT_ID === 'openclimbing';

const StyledPaper = styled(Paper)`
  position: sticky;
  top: 0;
  z-index: 1;
  opacity: 0.9;

  @media ${isMobileMode} {
    position: sticky;
  }
`;

const Ul = styled.ul`
  padding: 0;
  list-style: none;
`;

const ArrowIcon = styled(ArrowForwardIosIcon)`
  opacity: 0.2;
  margin-left: 12px;
`;

const Container = styled.div`
  margin: 0 0 20px 0;
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
    }
  }
`;

const CragListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 12px;
`;

const CragName = styled.div`
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const StyledLink = styled(Link)`
  text-decoration: none !important;
  &:hover h3 {
    text-decoration: underline;
  }
`;

const ChipContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Header = ({
  label,
  chipContent,
  typeLabel,
}: {
  label: string;
  chipContent?: React.ReactNode;
  typeLabel?: string;
}) => (
  <Box ml={2} mr={2}>
    <CragName>
      <Box display="flex" alignItems="baseline" gap={1} overflow="hidden">
        <Typography
          variant="h3"
          component="h3"
          overflow="hidden"
          textOverflow="ellipsis"
          color="primary"
        >
          {label}
        </Typography>
        {typeLabel && (
          <Typography
            component="span"
            fontSize={12}
            color="secondary"
            whiteSpace="nowrap"
          >
            {typeLabel}
          </Typography>
        )}
      </Box>
      {chipContent && (
        <Chip
          size="small"
          variant="outlined"
          label={chipContent}
          sx={{ position: 'relative', top: 2, fontWeight: 'normal' }}
        />
      )}
    </CragName>{' '}
  </Box>
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
        {naturalSort(images, (item) => item.def.k).map((item, index) => (
          <Image
            key={item.image.imageUrl}
            def={item.def}
            image={item.image}
            alt={`${alt} ${index + 1}`}
            onClick={getClickHandler(feature, item.def)}
          />
        ))}
      </Slider>
    </Wrapper>
  );
};

const getFeatureImages = (feature: Feature) =>
  feature?.imageDefs?.filter(isInstant)?.map((def) => ({
    def,
    image: getInstantImage(def),
  })) ?? [];

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
  const childImages = (feature.memberFeatures ?? []).flatMap(getFeatureImages);
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
        <Box mb={2}>
          <RouteDistribution features={feature.memberFeatures} />
        </Box>
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
    <Container>
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
  const otherFeatures = feature.memberFeatures.filter(
    ({ tags }) => tags.climbing !== 'crag' && tags.climbing !== 'area',
  );
  const hasMixed = subAreas.length > 0 && crags.length > 0;

  return (
    <Box mt={2} mb={4}>
      <CragListContainer>
        {subAreas.map((item) => (
          <AreaItem key={getOsmappLink(item)} feature={item} />
        ))}
        {crags.map((item) => (
          <CragItem
            key={getOsmappLink(item)}
            feature={item}
            showTypeLabel={hasMixed}
          />
        ))}
      </CragListContainer>

      {otherFeatures.length > 0 && (
        <Ul>
          {otherFeatures.map((item) => (
            <MemberItem key={getReactKey(item)} feature={item} />
          ))}
        </Ul>
      )}
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
    return <RouteDistribution features={allCragRoutes} />;
  }
  return null;
};

const FilterRow: React.FC = ({ children }) => (
  <StyledPaper elevation={0} square>
    <Stack
      direction="row"
      spacing={0.5}
      justifyContent="flex-end"
      m={1}
      alignItems="center"
    >
      {children}
    </Stack>
  </StyledPaper>
);

const useGetMemberAreas = () => {
  const { feature } = useFeatureContext();
  return feature.memberFeatures.filter(({ tags }) => tags.climbing === 'area');
};

const CragsInAreaInner = () => {
  const { sortByFn, sortBy, setSortBy } = useCragsInAreaSort();
  const unfilteredCrags = useGetMemberCrags();
  const crags = useGetFilteredCrags(unfilteredCrags).sort(sortByFn(sortBy));
  const subAreas = useGetMemberAreas();

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
