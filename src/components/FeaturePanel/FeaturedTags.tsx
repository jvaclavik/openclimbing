import React from 'react';
import styled from '@emotion/styled';
import { FeaturedTag } from './FeaturedTag';
import { FeaturedLinkChips, isFeaturedLinkRenderer } from './FeaturedLinkChips';
import { useFeatureContext } from '../utils/FeatureContext';
import { getFeaturedTagKeys } from './getFeaturedTagKeys';

const Spacer = styled.div`
  padding-bottom: 10px;
`;

const LinksWrap = styled.div`
  margin-bottom: 12px;
`;

export { getFeaturedTagKeys };

export const FeaturedTags = () => {
  const { feature } = useFeatureContext();
  const keys = getFeaturedTagKeys(feature);

  if (!keys.length) {
    return null;
  }

  const rest = keys.filter(
    ({ featuredKey }) => !isFeaturedLinkRenderer(featuredKey.renderer),
  );
  const hasLinks = rest.length !== keys.length;

  return (
    <>
      {hasLinks ? (
        <LinksWrap>
          <FeaturedLinkChips />
        </LinksWrap>
      ) : null}
      {rest.map(({ k, featuredKey }) => (
        <FeaturedTag key={k} k={k} renderer={featuredKey.renderer} />
      ))}
      <Spacer />
    </>
  );
};
