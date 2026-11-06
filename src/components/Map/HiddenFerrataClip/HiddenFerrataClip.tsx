import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import { isMobileMode } from '../../helpers';
import { useMapStateContext } from '../../utils/MapStateContext';
import {
  FERRATA_DETAIL_VIDEO_OPENED,
  matchHiddenFerrataClip,
} from './matchHiddenFerrataClip';
import type { HiddenFerrataClipMatch } from './matchHiddenFerrataClip';

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

/** The clip plays this many times, then closes on its own. */
export const HIDDEN_FERRATA_PLAY_COUNT = 2;

// Only these count as a user gesture in Safari. Unmuting on pointerdown or
// touchstart makes iOS pause the clip instead.
const UNMUTE_EVENTS = ['touchend', 'click', 'keydown'] as const;

const NextButton = styled(CloseButton)`
  top: auto;
  bottom: 4px;
  width: auto;
  min-width: 32px;
  min-height: 28px;
  padding: 0 7px;
  border-radius: 14px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.7);
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
  const spot = ready ? matchHiddenFerrataClip(view) : null;
  const [visit, setVisit] = useState<{
    spot: HiddenFerrataClipMatch | null;
    indices: Partial<Record<string, number>>;
  }>({ spot: null, indices: {} });

  useEffect(() => {
    setVisit((previous) => {
      if (spot === previous.spot) return previous;
      if (!spot) return { ...previous, spot };

      const previousIndex = previous.indices[spot.id] ?? -1;
      const index = (previousIndex + 1) % spot.sources.length;
      return { spot, indices: { ...previous.indices, [spot.id]: index } };
    });
  }, [spot]);

  if (!spot || spot !== visit.spot) return null;
  const index = visit.indices[spot.id] ?? 0;
  const src = spot.sources[index] ?? spot.sources[0];
  const onNext = () => {
    setVisit((previous) => {
      if (previous.spot !== spot) return previous;
      const nextIndex =
        ((previous.indices[spot.id] ?? 0) + 1) % spot.sources.length;
      return {
        ...previous,
        indices: { ...previous.indices, [spot.id]: nextIndex },
      };
    });
  };
  return (
    <HiddenFerrataClipPlayer
      key={src}
      id={spot.id}
      src={src}
      nextLabel={
        spot.sources.length > 1
          ? `${index + 1}/${spot.sources.length} ›`
          : undefined
      }
      onNext={onNext}
    />
  );
};

type PlayerProps = {
  id: string;
  src: string;
  nextLabel?: string;
  onNext: () => void;
};

const HiddenFerrataClipPlayer = ({
  id,
  src,
  nextLabel,
  onNext,
}: PlayerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playsRef = useRef(0);
  const stoppingRef = useRef(false);

  const close = () => {
    stoppingRef.current = true;
    videoRef.current?.pause();
    setDismissed(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || dismissed) return undefined;
    playsRef.current = 0;
    stoppingRef.current = false;
    let armed = false;
    let disposed = false;

    const disarm = () => {
      armed = false;
      UNMUTE_EVENTS.forEach((type) =>
        document.removeEventListener(type, unmute, true),
      );
    };

    // Browsers (iOS above all) refuse unmuted autoplay without a fresh tap.
    // Muted autoplay is always allowed, so keep playing muted and turn the
    // sound on with the next tap anywhere on the page.
    const playMuted = () => {
      if (disposed || stoppingRef.current) return;
      video.muted = true;
      video.play().catch(() => undefined);
      if (armed) return;
      armed = true;
      UNMUTE_EVENTS.forEach((type) =>
        document.addEventListener(type, unmute, true),
      );
    };

    function unmute() {
      disarm();
      playWithSound(video!).catch(playMuted);
    }

    // iOS can still pause a clip on its own (e.g. after unmuting). Only the
    // end of the second run or the close button may stop it.
    const onPause = () => {
      if (video.ended || stoppingRef.current || !video.isConnected) return;
      playMuted();
    };

    video.addEventListener('pause', onPause);
    document.addEventListener(FERRATA_DETAIL_VIDEO_OPENED, close);
    playWithSound(video).catch(playMuted);

    return () => {
      disposed = true;
      disarm();
      video.removeEventListener('pause', onPause);
      document.removeEventListener(FERRATA_DETAIL_VIDEO_OPENED, close);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <Frame data-clip={id}>
      <Player
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        onEnded={() => {
          const video = videoRef.current;
          playsRef.current += 1;
          if (!video || playsRef.current >= HIDDEN_FERRATA_PLAY_COUNT) {
            close();
            return;
          }
          video.currentTime = 0;
          video.play().catch(() => undefined);
        }}
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          if (video.paused || video.muted) {
            playWithSound(video)?.catch(() => undefined);
          }
        }}
      />
      <CloseButton
        type="button"
        aria-label="close"
        onClick={(event) => {
          event.stopPropagation();
          close();
        }}
      >
        <CloseIcon fontSize="inherit" />
      </CloseButton>
      {nextLabel && (
        <NextButton
          type="button"
          aria-label="Nächstes Video"
          onClick={(event) => {
            event.stopPropagation();
            onNext();
          }}
        >
          {nextLabel}
        </NextButton>
      )}
    </Frame>
  );
};
