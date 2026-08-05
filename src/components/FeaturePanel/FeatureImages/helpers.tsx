import { css, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { CONTENT_GAP } from '../../utils/PanelHelpers';

export const HEIGHT = 238;
export const TILE_RADIUS = 8;

// Tiles are sized before the photo arrives, so unknown ratios get a neutral
// landscape shape – the same fallback the homepage gallery uses.
export const DEFAULT_RATIO = 4 / 3;
export const PANORAMA_RATIO = 16 / 9;

export const getTileWidth = (ratio: number) => Math.round(HEIGHT * ratio);

export const tileCss = css`
  display: inline-block;
  vertical-align: top;
  height: ${HEIGHT}px;
  border-radius: ${TILE_RADIUS}px;
  overflow: hidden;

  margin-right: ${CONTENT_GAP};
  &:first-of-type {
    margin-left: ${CONTENT_GAP};
  }
`;

const shimmer = ({ theme }: { theme: Theme }) => {
  const isDark = theme.palette.mode === 'dark';
  const base = isDark ? 'hsl(0, 0%, 22%)' : 'hsl(0, 0%, 90%)';
  const highlight = isDark ? 'hsl(0, 0%, 31%)' : 'hsl(0, 0%, 96%)';

  return css`
    background-color: ${base};
    background-image: linear-gradient(
      100deg,
      transparent 25%,
      ${highlight} 50%,
      transparent 75%
    );
    background-size: 250% 100%;
    background-repeat: no-repeat;
    animation: image-shimmer 1.6s linear infinite;

    @keyframes image-shimmer {
      from {
        background-position: 150% 0;
      }
      to {
        background-position: -150% 0;
      }
    }
  `;
};

export const ImageSkeleton = styled.div<{ $ratio?: number }>`
  ${tileCss}
  ${shimmer}
  width: ${({ $ratio }) => getTileWidth($ratio ?? DEFAULT_RATIO)}px;
`;

type Edges = { left: boolean; right: boolean };

// Tells whether the strip can still be scrolled either way, so the arrows and
// the edge fades only show up when they actually lead somewhere.
export const useSliderScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    // photos arrive one by one and grow the strip; `load` doesn't bubble, so
    // it has to be caught on the way down
    el.addEventListener('load', update, true);
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      el.removeEventListener('load', update, true);
      observer.disconnect();
    };
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const el = ref.current;
    el?.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  return { ref, edges, scrollByPage };
};
