import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { ReactNode, useEffect, useState } from 'react';

const popIn = keyframes`
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  60% {
    transform: scale(1.22);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const wave = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.95;
  }
  100% {
    transform: scale(3.2);
    opacity: 0;
  }
`;

const glow = keyframes`
  0%,
  100% {
    filter: drop-shadow(0 0 0 transparent);
  }
  40% {
    filter: drop-shadow(0 0 10px var(--map-control-wave));
  }
`;

const Wrap = styled.div`
  --map-control-wave: ${({ theme }) => theme.palette.primary.main};
  position: relative;
  display: inline-flex;
  z-index: 1;
  animation:
    ${popIn} 0.45s cubic-bezier(0.22, 1.4, 0.36, 1) both,
    ${glow} 0.8s ease-in-out 0.1s 1;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Wave = styled.span<{ $delay: string }>`
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid var(--map-control-wave);
  box-shadow: 0 0 14px 1px var(--map-control-wave);
  pointer-events: none;
  animation: ${wave} 0.85s ease-out ${({ $delay }) => $delay} 1 both;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  display: inline-flex;
`;

// MapFilter (and similar always-on controls) mount with the page – skip those.
// Later mounts (user just enabled shadows/radar/…) still get the hint.
let initialControlsSettled = false;

/** Draws the eye to a newly appeared bottom-right map control. */
export const MapControlAppear = ({ children }: { children: ReactNode }) => {
  const [animate] = useState(initialControlsSettled);

  useEffect(() => {
    const id = window.setTimeout(() => {
      initialControlsSettled = true;
    }, 400);
    return () => clearTimeout(id);
  }, []);

  if (!animate) {
    return <>{children}</>;
  }

  return (
    <Wrap>
      <Wave $delay="0s" />
      <Wave $delay="0.28s" />
      <Content>{children}</Content>
    </Wrap>
  );
};
