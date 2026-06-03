import styled from '@emotion/styled';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Stack, Typography } from '@mui/material';
import Router from 'next/router';
import { getReactKey, getOsmappLink, getShortId } from '../../services/helpers';
import { getHumanPoiType, getLabel } from '../../helpers/featureLabel';
import { useFeatureContext } from '../utils/FeatureContext';
import { addFeatureCenterToCache } from '../../services/osm/featureCenterToCache';

const ParentItem = styled.div`
  margin: 12px 0 4px 0;
`;

export const ParentButton = ({
  children,
  title,
  parentFeature,
  hasArrow = true,
}) => {
  const handleLink = (e, parentFeature) => {
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
    <Typography component="h2" variant="subtitle2" color="primary">
      <Button
        size="small"
        variant="contained"
        color="secondary"
        startIcon={
          hasArrow ? (
            <ArrowBackIcon fontSize="inherit" color="inherit" />
          ) : undefined
        }
        onClick={(e) => handleLink(e, parentFeature)}
        href={getOsmappLink(parentFeature)}
        title={title}
      >
        {children}
      </Button>
    </Typography>
  );
};
export const ParentLinkContent = () => {
  const { feature } = useFeatureContext();

  const hasMoreParents = feature.parentFeatures?.length > 1;

  return (
    <>
      {hasMoreParents ? (
        <Stack direction="row" spacing={0.5}>
          {feature.parentFeatures?.map((parentFeature, i) => {
            const poiType = getHumanPoiType(parentFeature);
            const title = `${poiType} ${getLabel(parentFeature)}`;

            return (
              <ParentButton
                key={getReactKey(parentFeature)}
                title={title}
                parentFeature={parentFeature}
                hasArrow={false}
              >
                {getLabel(parentFeature)}
              </ParentButton>
            );
          })}
        </Stack>
      ) : (
        feature.parentFeatures?.map((parentFeature) => {
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
        })
      )}
    </>
  );
};

export const ParentLink = () => {
  const { feature } = useFeatureContext();
  const hasParentLink = feature.parentFeatures?.length;

  if (!hasParentLink) return null;

  return (
    <ParentItem>
      <ParentLinkContent />
    </ParentItem>
  );
};
