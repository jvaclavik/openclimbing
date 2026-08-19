import { css } from '@emotion/react';
import styled from '@emotion/styled';
import React, { useEffect, useState } from 'react';
import {
  getImageDefId,
  ImageType,
} from '../../../../services/images/getImageDefs';
import { getImagePlaceholderUrl } from '../../../../services/images/getImagePlaceholderUrl';
import { ImageDef, isTag } from '../../../../services/types';
import { isMobileMode } from '../../../helpers';
import { FEATURE_PANEL_WIDTH, PANEL_GAP } from '../../../utils/PanelHelpers';
import {
  ProgressiveImage,
  ProgressiveImageWrapper,
} from '../../../utils/ProgressiveImage';
import {
  DEFAULT_RATIO,
  getTileWidth,
  HEIGHT,
  PANORAMA_RATIO,
  tileCss,
} from '../helpers';
import { PathsSvg } from '../PathsSvg';
import { ImageClickHandler, UncertainCover, useImgError } from './helpers';
import { InfoButton } from './InfoButton';
import { PanoramaImg } from './PanoramaImg';
import {
  DrawnRoutesBadge,
  getDrawnRoutesCount,
  HoverAction,
  PhotoShade,
} from './PhotoOverlay';

// example wide image: relation/1515375
const CROP_IMAGE_CSS = css`
  max-width: calc(${FEATURE_PANEL_WIDTH}px - 2 * ${PANEL_GAP});
  @media ${isMobileMode} {
    max-width: calc(100% - 2 * ${PANEL_GAP});
  }

  &:has(+ div) {
    // if there is another image on the right, show 15px of it
    max-width: calc(${FEATURE_PANEL_WIDTH}px - 2 * ${PANEL_GAP} - 15px);
    @media ${isMobileMode} {
      max-width: calc(100% - 2 * ${PANEL_GAP} - 15px);
    }
  }
`;

const ImageWrapper = styled.div<{ $hasPaths: boolean; $highlighted?: boolean }>`
  ${tileCss}
  position: relative;
  background-color: ${({ theme }) => theme.palette.background.elevation};

  // an inset outline instead of a border, so the tile size stays exactly the
  // reserved one and the paths overlay keeps matching the photo
  outline: solid 2px transparent;
  outline-offset: -2px;
  ${({ $highlighted }) => $highlighted && `outline-color: #ea5540;`}

  transition:
    box-shadow 0.2s ease,
    outline-color 0.2s ease;

  ${({ onClick }) =>
    onClick &&
    `
      cursor: pointer;
      @media (hover: hover) {
        &:hover {
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        }
        &:hover ${HoverAction} {
          opacity: 1;
        }
      }
    `}

  ${({ $hasPaths }) => !$hasPaths && CROP_IMAGE_CSS}

  ${ProgressiveImageWrapper} {
    width: 100%;
    height: 100%;
    ${({ $hasPaths }) => $hasPaths && `opacity: 0.9;`}
  }
`;

type Props = {
  def: ImageDef;
  image: ImageType;
  onClick: ImageClickHandler;
  alt?: string;
  highlighted?: boolean;
  wrapperRef?: React.Ref<HTMLDivElement>;
  /** shown on hover, tells what clicking the photo does */
  actionLabel?: string;
  actionAccent?: boolean;
  /** first visible photo: skip lazy-load so Lighthouse can discover LCP */
  priority?: boolean;
};

export const Image = ({
  def,
  image,
  onClick,
  alt,
  highlighted,
  wrapperRef,
  actionLabel,
  actionAccent,
  priority,
}: Props) => {
  const { error, onError } = useImgError();
  const [ratio, setRatio] = useState<number | null>(image.ratio ?? null);

  useEffect(() => {
    setRatio(image.ratio ?? null);
  }, [image.imageUrl, image.ratio]);

  if (error) {
    return null; // TODO perhaps offer a retry button? But it would need investment in UX.
  }

  const isPanorama = !!image.panoramaUrl;
  const hasPaths =
    isTag(def) && !!(def.path?.length || def.memberPaths?.length);

  const knownRatio = ratio ?? (isPanorama ? PANORAMA_RATIO : DEFAULT_RATIO);
  const size = { width: getTileWidth(knownRatio), height: HEIGHT };

  return (
    <ImageWrapper
      ref={wrapperRef}
      $hasPaths={hasPaths}
      $highlighted={highlighted}
      onClick={onClick}
      style={{ width: size.width }}
    >
      {isPanorama ? (
        <PanoramaImg small={image.imageUrl} large={image.panoramaUrl} />
      ) : (
        <ProgressiveImage
          src={image.imageUrl}
          placeholderSrc={getImagePlaceholderUrl(image)}
          alt={alt || getImageDefId(def)}
          width={size.width}
          height={size.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          onRatio={setRatio}
          onError={onError}
        />
      )}
      {/* below the paths, so the drawn lines keep their contrast */}
      {!isPanorama && <PhotoShade />}
      {/* only once the tile matches the photo, otherwise the paths sit on a crop */}
      {hasPaths && ratio !== null && <PathsSvg def={def} size={size} />}
      <DrawnRoutesBadge count={getDrawnRoutesCount(def)} />
      {onClick && actionLabel && !isPanorama && (
        <HoverAction $accent={actionAccent}>{actionLabel}</HoverAction>
      )}
      {(isPanorama || ratio !== null) && <InfoButton image={image} />}
      {image.uncertainImage && !isPanorama && <UncertainCover />}
    </ImageWrapper>
  );
};
