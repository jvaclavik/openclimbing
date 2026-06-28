import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { getHumanPoiType } from '../../../helpers/featureLabel';
import { useFeatureContext } from '../../utils/FeatureContext';
import { PoiIcon } from '../../utils/icons/PoiIcon';

const PoiType = styled.div<{ $isSkeleton: Boolean }>`
  position: relative;
  display: flex;
  gap: 8px;

  img {
    position: relative;
    top: -1px;
    left: 1px;
  }
  svg {
    position: relative;
    top: 1px;
  }
`;

export const PoiDescription = () => {
  const { feature } = useFeatureContext();
  const poiType = getHumanPoiType(feature);

  return (
    <PoiType $isSkeleton={feature.skeleton}>
      <Typography
        variant="caption"
        color="secondary"
        textTransform="lowercase"
        component="h2"
      >
        {poiType}
      </Typography>
      <PoiIcon
        tags={feature.tags}
        ico={
          feature.skeleton || feature.point
            ? feature.properties.class
            : undefined
        }
        middle
      />
    </PoiType>
  );
};
