import { useEffect, useRef, useState } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { usePhotoChange } from './usePhotoChange';

// The gesture must start in a narrow strip at the very left/right screen edge —
// dragging anywhere in the middle belongs to the photo (pan/zoom) and to the
// route list, so it must stay untouched.
const EDGE_ZONE_PX = 36;

// How far the finger travels before we commit to "this is a horizontal swipe".
// Kept tiny so we can preventDefault early enough to stop iOS Safari from
// taking over the gesture as its own interactive back navigation.
const DECISION_DEAD_ZONE_PX = 6;

// Travel needed to actually switch the photo.
const SWIPE_THRESHOLD_PX = 110;

// Elements that own a horizontal drag/scroll of their own must not be hijacked.
const BLOCKED_SELECTOR = [
  '.Resizer', // split pane divider
  '.climbing-photo-gallery', // horizontally scrollable thumbnails in the header
  '.maplibregl-map',
  'input[type="range"]',
].join(',');

export type PhotoSwipeState = {
  dir: 1 | -1;
  progress: number;
  ready: boolean;
  targetPhoto: string;
  targetIndex: number;
  photosCount: number;
};

export const usePhotoEdgeSwipe = (): PhotoSwipeState | null => {
  const { photoPath, photoPaths, isEditMode } = useClimbingContext();
  const onPhotoChange = usePhotoChange();
  const [swipe, setSwipe] = useState<PhotoSwipeState | null>(null);

  // Listeners are attached once; they read the freshest values through a ref so
  // a photo change doesn't tear down and re-register them mid-gesture.
  const latest = useRef({ photoPath, photoPaths, isEditMode, onPhotoChange });
  latest.current = { photoPath, photoPaths, isEditMode, onPhotoChange };

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let horizontal = false;
    let dir: 1 | -1 = 1;
    let target: { photo: string; index: number; count: number } | null = null;
    let readyBuzzed = false;
    let readyNow = false;
    // The photo requested by the last swipe. Switching goes through the URL, so
    // the context needs a moment to catch up — until then this stands in for the
    // current photo, otherwise two quick swipes both land on the same one.
    let requestedPhoto: string | null = null;

    const reset = () => {
      tracking = false;
      horizontal = false;
      readyBuzzed = false;
      readyNow = false;
      target = null;
      setSwipe(null);
    };

    const getTarget = (direction: 1 | -1) => {
      const { photoPath, photoPaths: all } = latest.current;
      if (!all || all.length < 2) return null;
      if (requestedPhoto === photoPath || !all.includes(requestedPhoto)) {
        requestedPhoto = null;
      }
      const current = requestedPhoto ?? photoPath;
      const index = all.indexOf(current) + direction;
      if (index < 0 || index >= all.length) return null;
      return { photo: all[index], index, count: all.length };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (latest.current.isEditMode) return;
      if (e.touches.length !== 1) return;

      const element = e.target;
      if (element instanceof Element && element.closest(BLOCKED_SELECTOR)) {
        return;
      }

      const { clientX, clientY } = e.touches[0];
      const fromLeft = clientX <= EDGE_ZONE_PX;
      const fromRight = clientX >= window.innerWidth - EDGE_ZONE_PX;
      if (!fromLeft && !fromRight) return;

      dir = fromLeft ? -1 : 1;
      target = getTarget(dir);
      if (!target) return;

      startX = clientX;
      startY = clientY;
      tracking = true;
      horizontal = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || !target) return;
      if (e.touches.length !== 1) {
        // A second finger means pinch zoom — hand the gesture back untouched.
        reset();
        return;
      }

      // A touch that started at the edge is potentially ours, so keep the
      // zoom/pan wrapper from panning the photo out from under the finger.
      // Native scrolling is unaffected — nothing is preventDefault-ed until the
      // swipe is confirmed, and a drag that turns out to be vertical stops
      // being tracked right away.
      e.stopPropagation();

      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (!horizontal) {
        if (
          Math.abs(dx) < DECISION_DEAD_ZONE_PX &&
          Math.abs(dy) < DECISION_DEAD_ZONE_PX
        ) {
          return;
        }
        // Only a drag heading inward from its own edge counts; anything else
        // (vertical scroll, drag back out of the screen) releases the gesture
        // for the rest of this touch.
        const inward = dir === -1 ? dx > 0 : dx < 0;
        if (!inward || Math.abs(dx) <= Math.abs(dy)) {
          tracking = false;
          return;
        }
        horizontal = true;
      }

      // Locks the vertical scroll and, more importantly, keeps the browser from
      // turning this edge drag into a back navigation.
      if (e.cancelable) e.preventDefault();

      const progress = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD_PX);
      readyNow = progress >= 1;
      if (readyNow && !readyBuzzed) {
        readyBuzzed = true;
        navigator.vibrate?.(12);
      } else if (!readyNow && readyBuzzed) {
        readyBuzzed = false;
      }

      setSwipe({
        dir,
        progress,
        ready: readyNow,
        targetPhoto: target.photo,
        targetIndex: target.index,
        photosCount: target.count,
      });
    };

    const onTouchEnd = () => {
      if (horizontal && readyNow && target) {
        requestedPhoto = target.photo;
        latest.current.onPhotoChange(target.photo);
      }
      reset();
    };

    // Capture phase is essential: react-zoom-pan-pinch listens for touchmove on
    // its wrapper around the photo and calls stopPropagation() on every move of
    // a pan it started. A bubble-phase listener on window therefore never saw a
    // single move that began on the photo, which is most of the dialog.
    const capture = { capture: true };

    window.addEventListener('touchstart', onTouchStart, {
      ...capture,
      passive: true,
    });
    window.addEventListener('touchmove', onTouchMove, {
      ...capture,
      passive: false,
    });
    window.addEventListener('touchend', onTouchEnd, {
      ...capture,
      passive: true,
    });
    window.addEventListener('touchcancel', reset, {
      ...capture,
      passive: true,
    });

    return () => {
      window.removeEventListener('touchstart', onTouchStart, capture);
      window.removeEventListener('touchmove', onTouchMove, capture);
      window.removeEventListener('touchend', onTouchEnd, capture);
      window.removeEventListener('touchcancel', reset, capture);
    };
  }, []);

  return swipe;
};
