import { useRef } from 'react';
import { TransformWrapper as Wrapper } from 'react-zoom-pan-pinch';
import { useClimbingContext } from './contexts/ClimbingContext';
import { ZoomState } from './types';

// Pixel threshold below which a pointer movement during pan is treated as an
// accidental jitter (e.g. small hand tremor during a click) rather than an
// intentional pan. Without it, react-zoom-pan-pinch's window-level mousemove
// listener fires onPanning for every 1px movement, which would block point
// add-clicks in edit mode and cause spurious tiny velocity pans.
const PAN_INTENT_THRESHOLD_PX = 5;

export const TransformWrapper = ({ children }) => {
  const {
    setArePointerEventsDisabled,
    setPhotoZoom,
    isEditMode,
    isPanningDisabled,
    isAddingPointBlockedRef,
    isZoomingRef,
  } = useClimbingContext();

  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  const startPointerEvents = () => {
    setArePointerEventsDisabled(false);
  };
  const stopPointerEvents = () => {
    setArePointerEventsDisabled(true);
  };

  const handlePanningStart = (_ref, event: MouseEvent | TouchEvent) => {
    startPointerEvents();
    const point =
      'touches' in event && event.touches.length > 0
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : {
            x: (event as MouseEvent).clientX,
            y: (event as MouseEvent).clientY,
          };
    panStartRef.current = point;
  };

  const handlePanning = (_ref, event: MouseEvent | TouchEvent) => {
    if (isAddingPointBlockedRef.current) return;
    const start = panStartRef.current;
    if (!start) return;
    const current =
      'touches' in event && event.touches.length > 0
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : {
            x: (event as MouseEvent).clientX,
            y: (event as MouseEvent).clientY,
          };
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
    panStartRef.current = null;
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
  };

  return (
    <Wrapper
      doubleClick={{
        disabled: isEditMode,
        mode: 'toggle',
        step: 1,
        animationTime: 150,
      }}
      onWheelStart={stopPointerEvents}
      onWheelStop={startPointerEvents}
      onPinchingStart={stopPointerEvents}
      onPinchingStop={startPointerEvents}
      onZoomStart={handleZoomStart}
      onZoomStop={handleZoomStop}
      onPanningStart={handlePanningStart}
      onPanning={handlePanning}
      onPanningStop={handlePanningStop}
      maxScale={10}
      disablePadding
      // velocityDisabled prevents the library's momentum/fling animation on
      // pan release. With it enabled, an accidental sub-threshold mouse move
      // during a click could combine with stale lastMousePosition state inside
      // the library (it never resets between pan sessions) to launch a large
      // velocity pan that snaps the viewport to a bounds corner.
      panning={{ disabled: isPanningDisabled, velocityDisabled: true }}
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
