import { Feature } from '../../../services/types';
import { useMobileMode } from '../../helpers';
import { useFeatureContext } from '../../utils/FeatureContext';
import Router from 'next/router';
import { getShortId, getUrlOsmId } from '../../../services/helpers';
import { addFeatureCenterToCache } from '../../../services/osm/featureCenterToCache';
import { getLabel } from '../../../helpers/featureLabel';
import React from 'react';
import styled from '@emotion/styled';
import { PoiIcon } from '../../utils/icons/PoiIcon';
import { Typography } from '@mui/material';

const Li = styled.li`
  margin-left: 10px;
`;

type Props = {
  feature: Feature;
};

export const MemberItem = ({ feature }: Props) => {
  const mobileMode = useMobileMode();
  const { setPreview } = useFeatureContext();
  const osmId = feature.osmMeta;

  const handleClick = (e) => {
    e.preventDefault();
    setPreview(null);
    if (feature.center) {
      // seed the center so fetchFeature() skips the slow Overpass center query
      addFeatureCenterToCache(getShortId(osmId), feature.center);
    }
    Router.push(`/${getUrlOsmId(osmId)}${window.location.hash}`);
  };
  const handleHover = () => feature.center && setPreview(feature);

  return (
    <Li>
      <a
        href={`/${getUrlOsmId(osmId)}`}
        onClick={handleClick}
        onMouseEnter={mobileMode ? undefined : handleHover}
        onMouseLeave={() => setPreview(null)}
      >
        <PoiIcon tags={feature.tags} />
        {getLabel(feature)}
      </a>

      {feature.members ? (
        <Typography color="secondary" component="span" fontSize="12px">
          {' '}
          ({feature.members.length})
        </Typography>
      ) : null}
    </Li>
  );
};
