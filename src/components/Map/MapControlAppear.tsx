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

const ANIMATION_MS = 1200;

// MapFilter (and similar always-on controls) mount with the page – skip those.
// Later mounts (user just enabled shadows/radar/…) still get the hint.
let initialControlsSettled = false;
const playedIds = new Set<string>();

type Props = {
  id?: string;
  children: ReactNode;
};

/** Draws the eye to a newly appeared bottom-right map control. */
export const MapControlAppear = ({ id, children }: Props) => {
  const [play] = useState(() => {
    if (id && playedIds.has(id)) return false;
    if (id) playedIds.add(id);
    return initialControlsSettled;
  });
  const [done, setDone] = useState(!play);

  useEffect(() => {
    const settle = window.setTimeout(() => {
      initialControlsSettled = true;
    }, 400);
    return () => clearTimeout(settle);
  }, []);

  useEffect(() => {
    if (!play || done) return undefined;
    const finish = window.setTimeout(() => setDone(true), ANIMATION_MS);
    return () => clearTimeout(finish);
  }, [play, done]);

  if (!play || done) {
    return <>{children}</>;
  }

  return (
    <Wrap onClick={() => setDone(true)}>
      <Wave $delay="0s" />
      <Wave $delay="0.28s" />
      <Content>{children}</Content>
    </Wrap>
  );
};
