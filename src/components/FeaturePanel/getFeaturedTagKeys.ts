import { FEATURED_KEYS } from '../../services/tagging/featuredKeys';
import { Feature } from '../../services/types';
import uniqBy from 'lodash/uniqBy';

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
