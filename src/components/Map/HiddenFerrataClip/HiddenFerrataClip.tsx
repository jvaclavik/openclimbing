import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { isMobileMode } from '../../helpers';
import { useMapStateContext } from '../../utils/MapStateContext';
import { matchHiddenFerrataClip } from './matchHiddenFerrataClip';

const Frame = styled.div`
  position: absolute;
  z-index: 1050;
  top: 220px;
  right: 8px;
  width: 120px;
  pointer-events: auto;
  line-height: 0;

  @media ${isMobileMode} {
    top: 168px;
    width: 96px;
  }
`;

const Player = styled.video`
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  object-fit: cover;
  border-radius: 12px;
  background: #000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  cursor: pointer;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const playWithSound = (video: HTMLVideoElement) => {
  video.muted = false;
  video.volume = 1;
  return video.play();
};

export const HiddenFerrataClip = () => {
  const { view } = useMapStateContext();
  // The hash wins over the mapView cookie only in the browser. Rendering on the
  // server would hydrate the previous place's clip and then leave it stuck.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const clip = ready ? matchHiddenFerrataClip(view) : null;
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = clip != null && clip.id !== dismissedId;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !visible) return undefined;
    // If unmuted autoplay is blocked, the promise rejects and a tap plays it.
    playWithSound(video)?.catch(() => undefined);
    return undefined;
  }, [clip?.id, visible]);

  if (!visible || !clip) return null;

  return (
    <Frame data-clip={clip.id}>
      <Player
        key={clip.id}
        ref={videoRef}
        src={clip.src}
        autoPlay
        loop
        playsInline
        preload="auto"
        onClick={() => {
          const video = videoRef.current;
          if (!video || !video.paused) return;
          playWithSound(video)?.catch(() => undefined);
        }}
      />
      <CloseButton
        type="button"
        aria-label="close"
        onClick={(event) => {
          event.stopPropagation();
          setDismissedId(clip.id);
        }}
      >
        <CloseIcon fontSize="inherit" />
      </CloseButton>
    </Frame>
  );
};
