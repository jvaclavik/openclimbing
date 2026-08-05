import styled from '@emotion/styled';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, IconButton } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { t } from '../../../services/intl';
import { upscaleWikimediaThumbUrl } from '../../../services/images/getCommonsImageUrl';
import { ProgressiveImage } from '../../utils/ProgressiveImage';
import { ImagesType } from './useLoadImages';

const FULL_WIDTH = 1920;

const Backdrop = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: #000;
`;

const Stage = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
`;

const StageImage = styled(ProgressiveImage)`
  width: 100%;
  height: 100%;
`;

const Caption = styled.div`
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;

  a {
    color: #fff;
  }
`;

const Counter = styled.span`
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.5);
`;

const CornerButton = styled(IconButton)`
  position: absolute;
  top: calc(8px + env(safe-area-inset-top));
  right: 8px;
  z-index: 2;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.4);

  &:hover {
    background-color: rgba(0, 0, 0, 0.65);
  }
`;

const NavButton = styled(IconButton, {
  shouldForwardProp: (prop: string) => !prop.startsWith('$'),
})<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => $side}: 8px;
  transform: translateY(-50%);
  z-index: 2;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.4);

  &:hover {
    background-color: rgba(0, 0, 0, 0.65);
  }
`;

type Props = {
  images: ImagesType;
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
};

export const PhotoLightbox = ({ images, index, onChange, onClose }: Props) => {
  const isOpen = index !== null && !!images[index];
  const count = images.length;

  const step = useCallback(
    (direction: 1 | -1) => {
      if (index === null) {
        return;
      }
      onChange((index + direction + count) % count);
    },
    [index, count, onChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, step]);

  if (!isOpen) {
    return null;
  }

  const { image } = images[index];

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      slotProps={{ paper: { sx: { backgroundColor: '#000' } } }}
    >
      <Backdrop>
        <CornerButton onClick={onClose} aria-label={t('close_panel')}>
          <CloseIcon />
        </CornerButton>

        <Stage>
          <StageImage
            key={image.imageUrl}
            src={upscaleWikimediaThumbUrl(image.imageUrl, FULL_WIDTH)}
            // the gallery already has this one cached, so it shows instantly
            placeholderSrc={image.imageUrl}
            alt={image.description}
            blur={0}
            objectFit="contain"
            loading="eager"
          />
          {count > 1 && (
            <>
              <NavButton
                $side="left"
                onClick={() => step(-1)}
                aria-label={t('featurepanel.gallery_scroll_left')}
              >
                <ChevronLeftIcon />
              </NavButton>
              <NavButton
                $side="right"
                onClick={() => step(1)}
                aria-label={t('featurepanel.gallery_scroll_right')}
              >
                <ChevronRightIcon />
              </NavButton>
            </>
          )}
        </Stage>

        <Caption>
          <span dangerouslySetInnerHTML={{ __html: image.description }} />{' '}
          <a href={image.linkUrl} target="_blank" rel="noopener noreferrer">
            {image.link}
          </a>
          {count > 1 && (
            <Counter>
              {index + 1} / {count}
            </Counter>
          )}
        </Caption>
      </Backdrop>
    </Dialog>
  );
};
