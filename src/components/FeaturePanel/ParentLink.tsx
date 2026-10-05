import styled from '@emotion/styled';
import React, { Fragment } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getReactKey, getOsmappLink, getShortId } from '../../services/helpers';
import { getHumanPoiType, getLabel } from '../../helpers/featureLabel';
import { useFeatureContext } from '../utils/FeatureContext';
import { Chip, Skeleton, Typography } from '@mui/material';
import Router from 'next/router';
import { addFeatureCenterToCache } from '../../services/osm/featureCenterToCache';
import { isDesktop, isModifiedClick } from '../helpers';
import { groupParentFeatures } from './parentHierarchy';

const ParentItem = styled.div`
  margin: 12px 0 4px 0;
  min-width: 0;
  max-width: 100%;

  a,
  a:hover,
  a:focus,
  a:focus-visible {
    text-decoration: none !important;
  }
`;

const BreadcrumbScroller = styled.div`
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.palette.action.disabled} transparent;

  /* desktop close button sits over the top-right of the panel */
  @media ${isDesktop} {
    width: calc(100% - 36px);
  }

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.palette.action.disabled};
    border-radius: 3px;
  }
`;

const BreadcrumbRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  width: max-content;
  gap: 4px;
`;

const Separator = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 24px;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export const ParentButton = ({ children, title, parentFeature }) => {
  const handleLink = (e, parentFeature) => {
    if (isModifiedClick(e)) return;
    if (parentFeature.center) {
      // seed the center so fetchFeature() skips the slow Overpass center query
      addFeatureCenterToCache(
        getShortId(parentFeature.osmMeta),
        parentFeature.center,
      );
    }
    Router.push(getOsmappLink(parentFeature));
    e.preventDefault();
  };

  return (
    <Typography
      component="h2"
      variant="subtitle2"
      color="primary"
      sx={{
        display: 'flex',
        alignItems: 'center',
        m: 0,
        lineHeight: 0,
        flex: 'none',
      }}
    >
      <Chip
        size="small"
        label={children}
        onClick={(e) => handleLink(e, parentFeature)}
        href={getOsmappLink(parentFeature)}
        component="a"
        title={title}
        sx={{
          textDecoration: 'none',
          '&:hover, &:focus, &:focus-visible': { textDecoration: 'none' },
        }}
      />
    </Typography>
  );
};
export const ParentLinkContent = () => {
  const { feature } = useFeatureContext();
  const levels = groupParentFeatures(feature, feature.parentFeatures);

  return (
    <BreadcrumbScroller>
      <BreadcrumbRow>
        {levels.map((level, levelIndex) => (
          <Fragment
            key={level
              .map((parentFeature) => getReactKey(parentFeature))
              .join(',')}
          >
            {levelIndex > 0 && (
              <Separator aria-hidden>
                <ChevronRightIcon sx={{ fontSize: 18, display: 'block' }} />
              </Separator>
            )}
            {level.map((parentFeature) => {
              const poiType = getHumanPoiType(parentFeature);
              const title = `${poiType} ${getLabel(parentFeature)}`;

              return (
                <ParentButton
                  key={getReactKey(parentFeature)}
                  title={title}
                  parentFeature={parentFeature}
                >
                  {getLabel(parentFeature)}
                </ParentButton>
              );
            })}
          </Fragment>
        ))}
      </BreadcrumbRow>
    </BreadcrumbScroller>
  );
};

export const ParentLink = () => {
  const { feature } = useFeatureContext();
  const hasParentLink = feature.parentFeatures?.length;
  const awaitingParent =
    feature.skeleton && feature.properties?.parentId != null && !hasParentLink;

  if (awaitingParent) {
    return (
      <ParentItem>
        <Skeleton
          variant="rounded"
          width={128}
          height={24}
          sx={{ borderRadius: '16px' }}
        />
      </ParentItem>
    );
  }

  if (!hasParentLink) return null;

  return (
    <ParentItem>
      <ParentLinkContent />
    </ParentItem>
  );
};
