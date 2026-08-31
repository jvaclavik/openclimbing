import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { getSeoPoiType } from '../../../helpers/featureLabel';
import { useFeatureContext } from '../../utils/FeatureContext';
import { PoiIcon } from '../../utils/icons/PoiIcon';

const PoiType = styled.span<{ $srOnly?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  ${({ $srOnly }) =>
    $srOnly &&
    `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `}
`;

type PoiDescriptionProps = {
  srOnly?: boolean;
};

export const PoiDescription = ({ srOnly }: PoiDescriptionProps) => {
  const { feature } = useFeatureContext();
  const poiType = getSeoPoiType(feature);

  return (
    <PoiType $srOnly={srOnly}>
      {' '}
      <Typography
        variant="caption"
        color="secondary"
        component="span"
        sx={{
          textTransform: 'lowercase',
        }}
      >
        {poiType}
      </Typography>
      <PoiIcon
        tags={feature.tags}
        ico={feature.point ? feature.properties.class : undefined}
        middle
      />
    </PoiType>
  );
};
