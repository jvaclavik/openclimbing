import styled from '@emotion/styled';
import { Box, Skeleton, Stack } from '@mui/material';
import React from 'react';
import { Feature } from '../../services/types';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { tint } from '../utils/panelUi';
import { HEIGHT, ImageSkeleton } from './FeatureImages/helpers';
import { PanelLabel } from './Climbing/PanelLabel';
import { t } from '../../services/intl';

const PHOTO_RATIOS = [4 / 3, 3 / 4, 3 / 2];

const PhotosRow = styled.div`
  display: flex;
  overflow: hidden;
  height: ${HEIGHT}px;
  margin-bottom: 16px;
`;

const clampCount = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const getHints = (feature: Feature) => {
  const p = feature.properties;
  const type = String(p.type ?? p.climbing ?? '');
  return {
    isArea: type === 'area',
    isCrag: type === 'crag',
    isRoute:
      type === 'route' || type === 'route_bottom' || type === 'route_top',
    routeCount: Number(p.routeCount ?? p.osmappRouteCount ?? 0) || 0,
    hasImages: Boolean(p.hasImages ?? p.osmappHasImages),
    hasHistogram: Boolean(p.histogramCode),
    isRelation: feature.osmMeta?.type === 'relation',
  };
};

const PhotosSkeleton = ({ count }: { count: number }) => (
  <PhotosRow>
    {PHOTO_RATIOS.slice(0, count).map((ratio) => (
      <ImageSkeleton key={ratio} $ratio={ratio} />
    ))}
  </PhotosRow>
);

const RouteRowSkeleton = () => (
  <Stack direction="row" alignItems="center" gap={1.5} py={1} px={1.5}>
    <Skeleton variant="circular" width={22} height={22} />
    <Skeleton variant="text" width="58%" height={22} />
    <Box flex={1} />
    <Skeleton
      variant="rounded"
      width={36}
      height={18}
      sx={{ borderRadius: 1 }}
    />
  </Stack>
);

const CragCardSkeleton = () => (
  <Box
    sx={(theme) => ({
      mx: 2,
      mb: 1.5,
      p: 1.5,
      borderRadius: '12px',
      backgroundColor: tint(theme, 0.035),
    })}
  >
    <Skeleton
      variant="rounded"
      height={110}
      sx={{ borderRadius: '10px', mb: 1.25 }}
    />
    <Skeleton variant="text" width="72%" height={22} />
    <Skeleton variant="text" width="38%" height={16} />
  </Box>
);

const MemberRowSkeleton = () => (
  <Stack direction="row" alignItems="center" gap={1} py={0.75}>
    <Skeleton variant="circular" width={16} height={16} />
    <Skeleton variant="text" width="64%" height={18} />
  </Stack>
);

const PropertiesSkeleton = () => (
  <Box mt={1} mb={2}>
    {[72, 54, 66, 40].map((width) => (
      <Stack key={width} direction="row" gap={2} py={0.6} alignItems="center">
        <Skeleton variant="text" width={96} height={18} />
        <Skeleton variant="text" width={`${width}%`} height={18} />
      </Stack>
    ))}
  </Box>
);

const HistogramSkeleton = () => (
  <Box px={2} mt={1} mb={1}>
    <Skeleton variant="rounded" height={72} sx={{ borderRadius: 1 }} />
  </Box>
);

type Props = {
  feature: Feature;
};

export const FeaturePanelSkeleton = ({ feature }: Props) => {
  const {
    isArea,
    isCrag,
    isRoute,
    routeCount,
    hasImages,
    hasHistogram,
    isRelation,
  } = getHints(feature);

  const showPhotos = hasImages || isCrag || isArea || isRoute;
  const photoCount = hasImages ? 3 : 1;
  const cragCards = isArea ? clampCount(routeCount || 3, 2, 4) : 0;
  const routeRows = isCrag ? clampCount(routeCount || 6, 4, 8) : 0;
  const memberRows = !isCrag && !isArea && isRelation ? 3 : 0;
  const showProperties = !isArea;

  return (
    <>
      {showPhotos && <PhotosSkeleton count={photoCount} />}

      {cragCards > 0 && (
        <Box mb={1}>
          <PanelLabel>{t('featurepanel.climbing_sectors')}</PanelLabel>
          {Array.from({ length: cragCards }, (_, i) => (
            <CragCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {hasHistogram && isCrag && <HistogramSkeleton />}

      <PanelSidePadding>
        {routeRows > 0 && (
          <Box ml={-2} mr={-2} mb={1}>
            <PanelLabel>{t('member_features.climbing')}</PanelLabel>
            {Array.from({ length: routeRows }, (_, i) => (
              <RouteRowSkeleton key={i} />
            ))}
          </Box>
        )}

        {memberRows > 0 && (
          <Box mb={1}>
            {Array.from({ length: memberRows }, (_, i) => (
              <MemberRowSkeleton key={i} />
            ))}
          </Box>
        )}

        {showProperties && <PropertiesSkeleton />}
      </PanelSidePadding>
    </>
  );
};
