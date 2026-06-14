import React from 'react';
import styled from '@emotion/styled';
import { FeaturedTag } from './FeaturedTag';
import { useFeatureContext } from '../utils/FeatureContext';
import { FEATURED_KEYS } from '../../services/tagging/featuredKeys';
import { Feature } from '../../services/types';
import uniqBy from 'lodash/uniqBy';

const Spacer = styled.div`
  padding-bottom: 10px;
`;

// Visible featured tags (website, phone, wikipedia, ...). NullRenderer keys
// (eg. description) are excluded as they don't render anything here.
export const getFeaturedTagKeys = (feature: Feature) => {
  const duplicatedKeys =
    feature.schema?.featuredTags
      .map(([k, v]) => ({
        k,
        v,
        featuredKey: FEATURED_KEYS.find(({ matcher }) => matcher.test(k)),
      }))
      .filter(
        ({ featuredKey, v }) =>
          featuredKey && v && featuredKey.renderer !== 'NullRenderer',
      ) ?? [];

  return uniqBy(
    duplicatedKeys,
    ({ featuredKey, v, k }) =>
      `${featuredKey.renderer}-${featuredKey.uniqPredicate?.(k, v) ?? v}`,
  );
};

export const FeaturedTags = () => {
  const { feature } = useFeatureContext();

  const keys = getFeaturedTagKeys(feature);

  if (!keys.length) {
    return null;
  }

  return (
    <>
      {keys.map(({ k, featuredKey }) => {
        return <FeaturedTag key={k} k={k} renderer={featuredKey.renderer} />;
      })}
      <Spacer />
    </>
  );
};
