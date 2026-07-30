import styled from '@emotion/styled';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { CSSProperties } from 'react';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { convertHexToRgba } from '../../utils/colorUtils';
import { usePhotoEdgeSwipe } from './utils/usePhotoEdgeSwipe';

// The whole animation is driven by the `--p` (progress) custom property so the
// gesture only writes one number per frame instead of restyling components.
const Hint = styled.div<{ $dir: 1 | -1 }>`
  position: fixed;
  top: 50%;
  ${({ $dir }) => ($dir === 1 ? 'right: 8px;' : 'left: 8px;')}
  z-index: 1400;
  pointer-events: none;
  display: flex;
  flex-direction: ${({ $dir }) => ($dir === 1 ? 'row-reverse' : 'row')};
  align-items: center;
  gap: 8px;
  opacity: calc(0.4 + 0.6 * var(--p));
  transform: translateY(-50%)
    translateX(
      calc((1 - var(--p)) * ${({ $dir }) => ($dir === 1 ? '72px' : '-72px')})
    );
`;

const Circle = styled.div<{ $ready: boolean }>`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: ${({ $ready, theme }) =>
    $ready ? theme.palette.primary.contrastText : theme.palette.text.secondary};
  background: ${({ $ready, theme }) =>
    $ready
      ? theme.palette.primary.main
      : convertHexToRgba(theme.palette.background.paper, 0.9)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition:
    background 0.12s ease,
    color 0.12s ease,
    transform 0.12s ease;
  transform: scale(${({ $ready }) => ($ready ? 1.12 : 1)});
`;

const Preview = styled.div<{ $ready: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 8px;
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.paper, 0.9)};
  border: 1px solid
    ${({ $ready, theme }) =>
      $ready ? theme.palette.primary.main : theme.palette.divider};
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
`;

const PreviewImage = styled.img`
  display: block;
  height: 44px;
  width: auto;
  max-width: 30vw;
  border-radius: 4px;
`;

const Counter = styled.span`
  padding-right: 4px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
`;

export const ClimbingPhotoEdgeSwipe = () => {
  const swipe = usePhotoEdgeSwipe();

  if (!swipe) return null;

  const { dir, progress, ready, targetPhoto, targetIndex, photosCount } = swipe;
  const thumbUrl = getCommonsImageUrl(`File:${targetPhoto}`, 120);

  return (
    <Hint
      $dir={dir}
      style={{ '--p': progress } as CSSProperties}
      aria-hidden="true"
    >
      <Circle $ready={ready}>
        {dir === 1 ? (
          <ArrowForwardIosIcon fontSize="small" />
        ) : (
          <ArrowBackIosNewIcon fontSize="small" />
        )}
      </Circle>
      <Preview $ready={ready}>
        {thumbUrl && <PreviewImage src={thumbUrl} alt="" />}
        <Counter>{`${targetIndex + 1}/${photosCount}`}</Counter>
      </Preview>
    </Hint>
  );
};
