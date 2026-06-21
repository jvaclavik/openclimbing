import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Scrollbars } from 'react-custom-scrollbars';
import { Image } from './Image/Image';
import { useLoadImages } from './useLoadImages';
import { NoImage } from './NoImage';
import { HEIGHT, ImageSkeleton } from './helpers';
import { getClickHandler } from './Image/helpers';
import { PROJECT_ID } from '../../../services/project';
import { useFeatureContext } from '../../utils/FeatureContext';
import { getHumanPoiType, getLabel } from '../../../helpers/featureLabel';
import { isTag } from '../../../services/types';
import { photoNameKey } from '../Climbing/utils/photo';
import { usePhotoHighlightContext } from '../Climbing/contexts/PhotoHighlightContext';

const isOpenClimbing = PROJECT_ID === 'openclimbing';

export const Wrapper = styled.div`
  width: 100%;
  height: calc(${HEIGHT}px + 10px); // 10px for scrollbar
  min-height: calc(${HEIGHT}px + 10px); // otherwise it shrinks b/c of flex
`;

const StyledScrollbars = styled(Scrollbars)`
  width: 100%;
  height: 100%;
  white-space: nowrap;
  ${!isOpenClimbing && `text-align: center;`} // one image centering

  overflow-y: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
`;
export const Slider = ({ children }) => (
  <StyledScrollbars universal autoHide suppressHydrationWarning={true}>
    {children}
  </StyledScrollbars>
);

export const FeatureImages = () => {
  const { feature } = useFeatureContext();
  const { loading, images } = useLoadImages();
  const { highlightedPhoto, highlightToken } = usePhotoHighlightContext();
  const itemRefs = useRef<Record<string, HTMLDivElement>>({});
  const poiType = getHumanPoiType(feature);
  const alt = `${poiType} ${getLabel(feature)}`;

  // Scroll the requested photo into view whenever a crag photo marker on the
  // map is clicked (highlightToken changes even when re-clicking the same one).
  useEffect(() => {
    if (!highlightedPhoto) return;
    const el = itemRefs.current[photoNameKey(highlightedPhoto)];
    el?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [highlightedPhoto, highlightToken]);

  if (images.length === 0) {
    // CragsInArea condition
    if (feature.memberFeatures?.length && feature.tags.climbing === 'area') {
      return null;
    } else {
      return <Wrapper>{loading ? <ImageSkeleton /> : <NoImage />}</Wrapper>;
    }
  }

  const highlightedKey = highlightedPhoto
    ? photoNameKey(highlightedPhoto)
    : null;

  return (
    <Wrapper>
      <Slider>
        {images.map((item, index) => {
          const key = isTag(item.def) ? photoNameKey(item.def.v) : null;
          return (
            <Image
              key={item.image.imageUrl}
              def={item.def}
              image={item.image}
              onClick={getClickHandler(feature, item.def)}
              alt={`${alt} ${index + 1}`}
              highlighted={!!key && key === highlightedKey}
              wrapperRef={(el) => {
                if (key) {
                  if (el) itemRefs.current[key] = el;
                  else delete itemRefs.current[key];
                }
              }}
            />
          );
        })}
      </Slider>
    </Wrapper>
  );
};
