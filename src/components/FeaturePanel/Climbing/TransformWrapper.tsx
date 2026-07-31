import { useRef } from 'react';
import { TransformWrapper as Wrapper } from 'react-zoom-pan-pinch';
import { useClimbingContext } from './contexts/ClimbingContext';
import {
  PANNING_EXCLUDED_CLASS,
  usePreventTouchDefaultOnDragHandles,
} from './Editor/utils';
import { ZoomState } from './types';
import { useCropAnchor } from './useCropAnchor';

const MAX_SCALE = 10;

// Pixel threshold below which a pointer movement during pan is treated as an
// accidental jitter (e.g. small hand tremor during a click) rather than an
// intentional pan. Without it, react-zoom-pan-pinch's window-level mousemove
// listener fires onPanning for every 1px movement, which would block point
// add-clicks in edit mode and cause spurious tiny velocity pans.
const PAN_INTENT_THRESHOLD_PX = 5;

// A gesture is treated as a click (not a pan) when the press is short and the
// pointer travelled only a little between press and release. Clicking fast
// while drawing a route often drags a few pixels mid-press, which would
// otherwise be misread as a pan and swallow the click.
const CLICK_MAX_DURATION_MS = 250;
const CLICK_MAX_TRAVEL_PX = 24;

export const TransformWrapper = ({ children }) => {
  const {
    setArePointerEventsDisabled,
    setPhotoZoom,
    isPanningDisabled,
    isAddingPointBlockedRef,
    isZoomingRef,
    isEditMode,
  } = useClimbingContext();

  const panStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const panLastRef = useRef<{ x: number; y: number } | null>(null);

  const { handleInit, captureAnchor } = useCropAnchor();
  usePreventTouchDefaultOnDragHandles();

  const startPointerEvents = () => {
    setArePointerEventsDisabled(false);
  };
  const stopPointerEvents = () => {
    setArePointerEventsDisabled(true);
  };

  const handleWheelStop = () => {
    startPointerEvents();
    captureAnchor();
  };

  const getPoint = (event: MouseEvent | TouchEvent) =>
    'touches' in event && event.touches.length > 0
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };

  const handlePanningStart = (_ref, event: MouseEvent | TouchEvent) => {
    startPointerEvents();
    const point = getPoint(event);
    panStartRef.current = { ...point, time: Date.now() };
    panLastRef.current = point;
  };

  const handlePanning = (_ref, event: MouseEvent | TouchEvent) => {
    const start = panStartRef.current;
    if (!start) return;
    const current = getPoint(event);
    panLastRef.current = current;
    if (isAddingPointBlockedRef.current) return;
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    if (
      dx * dx + dy * dy >=
      PAN_INTENT_THRESHOLD_PX * PAN_INTENT_THRESHOLD_PX
    ) {
      isAddingPointBlockedRef.current = true;
    }
  };

  const handlePanningStop = () => {
    startPointerEvents();
    const start = panStartRef.current;
    const last = panLastRef.current;
    panStartRef.current = null;
    panLastRef.current = null;
    captureAnchor();

    // A short press with little travel is a click (even if it briefly crossed
    // the pan threshold mid-gesture): unblock immediately so the click event
    // firing right after mouseup can add the point. A real pan keeps blocking
    // for a moment to swallow the trailing click.
    const dx = start && last ? last.x - start.x : 0;
    const dy = start && last ? last.y - start.y : 0;
    const duration = start ? Date.now() - start.time : Infinity;
    const isClick =
      duration <= CLICK_MAX_DURATION_MS &&
      dx * dx + dy * dy <= CLICK_MAX_TRAVEL_PX * CLICK_MAX_TRAVEL_PX;

    if (isClick) {
      isAddingPointBlockedRef.current = false;
      return;
    }
    setTimeout(() => {
      isAddingPointBlockedRef.current = false;
    }, 300);
  };

  const handleZoomStart = () => {
    isZoomingRef.current = true;
    stopPointerEvents();
  };
  const handleZoomStop = () => {
    isZoomingRef.current = false;
    startPointerEvents();
    captureAnchor();
  };

  // Pinch fires before the first zoom event, so flag zooming here too —
  // otherwise the moves at the very start of a pinch could still drag a point
  // that a finger happened to land on.
  const handlePinchingStart = () => {
    isZoomingRef.current = true;
    stopPointerEvents();
  };
  const handlePinchingStop = () => {
    isZoomingRef.current = false;
    startPointerEvents();
    captureAnchor();
  };

  return (
    <Wrapper
      // Double-click / double-tap zooms the photo, but only in view mode. In
      // edit mode it would clash with the drawing gestures (a tap adds a route
      // point, a double-click on the last point finishes the route), so it stays
      // off there. `excluded` also skips double-clicks that land directly on a
      // route point / drag handle so those never trigger a zoom.
      doubleClick={{
        disabled: isEditMode,
        mode: 'toggle',
        step: 1.2,
        animationTime: 150,
        excluded: [PANNING_EXCLUDED_CLASS],
      }}
      onWheelStart={stopPointerEvents}
      onWheelStop={handleWheelStop}
      onPinchingStart={handlePinchingStart}
      onPinchingStop={handlePinchingStop}
      onZoomStart={handleZoomStart}
      onZoomStop={handleZoomStop}
      onPanningStart={handlePanningStart}
      onPanning={handlePanning}
      onPanningStop={handlePanningStop}
      onInit={handleInit}
      maxScale={MAX_SCALE}
      disablePadding
      // velocityDisabled prevents the library's momentum/fling animation on
      // pan release. With it enabled, an accidental sub-threshold mouse move
      // during a click could combine with stale lastMousePosition state inside
      // the library (it never resets between pan sessions) to launch a large
      // velocity pan that snaps the viewport to a bounds corner.
      // `excluded` is the reliable guard for point drags: the library skips
      // starting a pan when the gesture begins on a point (matched
      // synchronously against the DOM target), so a touch drag can never be
      // hijacked into a pan. `disabled` stays as a secondary safeguard.
      panning={{
        disabled: isPanningDisabled,
        velocityDisabled: true,
        excluded: [PANNING_EXCLUDED_CLASS],
      }}
      wheel={{ step: 100 }}
      centerOnInit
      onTransformed={(_ref, state: ZoomState) => {
        setPhotoZoom(state);
      }}
    >
      {children}
    </Wrapper>
  );
};
