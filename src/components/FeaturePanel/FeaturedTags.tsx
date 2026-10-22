import styled from '@emotion/styled';
import { useFeatureContext } from '../utils/FeatureContext';
import {
  FeaturedLinkChips,
  hasVisibleLinkChips,
  isFeaturedLinkRenderer,
} from './FeaturedLinkChips';
import { FeaturedTag } from './FeaturedTag';
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
  const rest = keys.filter(
    ({ featuredKey }) => !isFeaturedLinkRenderer(featuredKey.renderer),
  );
  const hasLinks = hasVisibleLinkChips(feature);

  if (!rest.length && !hasLinks) {
    return null;
  }

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
