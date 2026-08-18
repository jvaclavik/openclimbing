import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Image } from './Image/Image';
import { getClimbingPhotoAlt } from './getClimbingPhotoAlt';
import { useLoadImages } from './useLoadImages';
import { NoImage } from './NoImage';
import { HEIGHT, ImageSkeleton, useSliderScroll } from './helpers';
import { getClickHandler } from './Image/helpers';
import { PhotoLightbox } from './PhotoLightbox';
import { PROJECT_ID } from '../../../services/project';
import { useFeatureContext } from '../../utils/FeatureContext';
import { t } from '../../../services/intl';
import { isTag } from '../../../services/types';
import { photoNameKey } from '../Climbing/utils/photo';
import { usePhotoHighlightContext } from '../Climbing/contexts/PhotoHighlightContext';
import { isClimbingCragOrArea, isClimbingRoute } from '../../../utils';

const isOpenClimbing = PROJECT_ID === 'openclimbing';

export const Wrapper = styled.div`
  width: 100%;
  height: calc(${HEIGHT}px + 10px); // 10px for scrollbar
  min-height: calc(${HEIGHT}px + 10px); // otherwise it shrinks b/c of flex
`;

const SliderOuter = styled.div`
  position: relative;
  height: 100%;
`;

const StyledSlider = styled.div`
  width: 100%;
  height: 100%;
  white-space: nowrap;
  ${!isOpenClimbing && `text-align: center;`} // one image centering

  overflow-y: hidden;
  overflow-x: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
`;

const EdgeFade = styled.div<{ $side: 'left' | 'right'; $visible: boolean }>`
  position: absolute;
  top: 0;
  ${({ $side }) => $side}: 0;
  width: 28px;
  height: ${HEIGHT}px;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  background: linear-gradient(
    to ${({ $side }) => ($side === 'left' ? 'right' : 'left')},
    ${({ theme }) => theme.palette.background.default},
    transparent
  );
`;

// a div, not a button – the strip is rendered inside a <Link> in CragsInArea,
// and interactive elements must not nest inside an anchor
const ArrowButton = styled.div<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: ${HEIGHT / 2}px;
  ${({ $side }) => $side}: 6px;
  transform: translateY(-50%);
  z-index: 2;

  display: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;

  @media (hover: hover) {
    display: flex;
    ${SliderOuter}:hover & {
      opacity: 1;
    }
    &:hover {
      background-color: rgba(0, 0, 0, 0.75);
    }
  }
`;

export const Slider = ({ children }) => {
  const { ref, edges, scrollByPage } = useSliderScroll();

  const onArrowClick = (direction: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollByPage(direction);
  };

  return (
    <SliderOuter>
      <StyledSlider ref={ref}>{children}</StyledSlider>
      <EdgeFade $side="left" $visible={edges.left} />
      <EdgeFade $side="right" $visible={edges.right} />
      {edges.left && (
        <ArrowButton $side="left" aria-hidden onClick={onArrowClick(-1)}>
          <ChevronLeftIcon fontSize="small" />
        </ArrowButton>
      )}
      {edges.right && (
        <ArrowButton $side="right" aria-hidden onClick={onArrowClick(1)}>
          <ChevronRightIcon fontSize="small" />
        </ArrowButton>
      )}
    </SliderOuter>
  );
};

const SKELETON_RATIOS = [4 / 3, 3 / 4, 3 / 2];

const GallerySkeleton = ({ count }: { count: number }) => (
  <Wrapper>
    <Slider>
      {SKELETON_RATIOS.slice(0, Math.max(1, count)).map((ratio) => (
        <ImageSkeleton key={ratio} $ratio={ratio} />
      ))}
    </Slider>
  </Wrapper>
);

export const FeatureImages = () => {
  const { feature } = useFeatureContext();
  const { loading, images } = useLoadImages();
  const { highlightedPhoto, highlightToken } = usePhotoHighlightContext();
  const itemRefs = useRef<Record<string, HTMLDivElement>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    }
    if (loading) {
      return <GallerySkeleton count={feature.imageDefs?.length ?? 1} />;
    }
    // Climbing features look cleaner without the big placeholder icon.
    const isClimbingFeature =
      isClimbingCragOrArea(feature.tags) || isClimbingRoute(feature.tags);
    if (isClimbingFeature) {
      return null;
    }
    return (
      <Wrapper>
        <NoImage />
      </Wrapper>
    );
  }

  const highlightedKey = highlightedPhoto
    ? photoNameKey(highlightedPhoto)
    : null;

  return (
    <>
      <Wrapper>
        <Slider>
          {images.map((item, index) => {
            const key = isTag(item.def) ? photoNameKey(item.def.v) : null;
            const openTopo = getClickHandler(feature, item.def);
            return (
              <Image
                key={item.image.imageUrl}
                def={item.def}
                image={item.image}
                onClick={openTopo ?? (() => setLightboxIndex(index))}
                actionLabel={
                  openTopo
                    ? t('featurepanel.photo_show_topo')
                    : t('featurepanel.photo_enlarge')
                }
                alt={getClimbingPhotoAlt(feature, item.def)}
                highlighted={!!key && key === highlightedKey}
                priority={index === 0}
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
      <PhotoLightbox
        images={images}
        index={lightboxIndex}
        onChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
};
