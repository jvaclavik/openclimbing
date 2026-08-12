import React, { useCallback, useEffect, useRef } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { useRafThrottle } from './useRafThrottle';
import { updateElementOnIndex } from '../utils/array';
import { getPositionInImageFromMouse } from '../utils/mousePositionUtils';
import { useBackgroundTap } from './useBackgroundTap';

// A press only turns into a point drag after travelling this far from the
// pointer-down position. Fingers (and fast mouse clicks) always jitter a few
// pixels, which would otherwise register as a micro-drag: the point would jump
// slightly and the drag marker would then suppress the point menu on release.
const DRAG_START_THRESHOLD_PX = 5;

// Window in which a second background tap counts as a double-tap (zoom gesture)
// rather than a deliberate deselect. Long enough to cover a mouse double-click
// and a finger double-tap, short enough that a single tap's deselect still
// feels immediate.
const DOUBLE_TAP_MS = 300;

export const useRoutesLayerSvgHandlers = () => {
  const {
    machine,
    routeSelectedIndex,
    routeIndexHovered,
    isPointMoving,
    setIsPointClicked,
    setIsPointMoving,
    setPointSelectedIndex,
    setIsPanningDisabled,
    svgRef,
    setMousePosition,
    getPercentagePosition,
    findCloserPoint,
    updatePathOnRouteIndex,
    pointSelectedIndex,
    isPointClicked,
    photoZoom,
    isZoomingRef,
    pointWasDraggedRef,
    isPointClickedRef,
    isProtectionPointClickedRef,
    isEditMode,
    isPlacingProtectionPoints,
    addProtectionPoint,
    isProtectionPointClicked,
    isProtectionPointMoving,
    protectionPointSelectedIndex,
    setProtectionPointSelectedIndex,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
    updateProtectionPointPositionAtIndex,
  } = useClimbingContext();

  // Tracks every pointer currently touching the SVG. Two or more pointers mean
  // a pinch-zoom is in progress, which must never drag a point — not even for
  // the finger that happened to land on one, and not for the finger that stays
  // down after the pinch ends.
  const activePointersRef = useRef<Set<number>>(new Set());

  // Where the current gesture's first pointer landed — the reference for the
  // drag-start threshold.
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);

  // A double-tap / double-click on the empty background zooms the photo (the
  // pan/zoom wrapper handles it). Its first tap must not deselect the current
  // route, so in view mode the background-tap deselect is deferred by one
  // double-tap window and skipped when a second tap arrives.
  const lastBackgroundTapRef = useRef(0);
  const pendingDeselectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeSelectedIndexRef = useRef(routeSelectedIndex);
  routeSelectedIndexRef.current = routeSelectedIndex;

  useEffect(
    () => () => {
      if (pendingDeselectRef.current) clearTimeout(pendingDeselectRef.current);
    },
    [],
  );

  // Authoritative cleanup at the window level. During a pinch the fingers often
  // lift outside the SVG (or after the transform re-renders), so the SVG's own
  // pointerup/pointercancel never fires for them and their ids would stay stuck
  // in the set forever — leaving isMultiTouch permanently true and silently
  // blocking every later single-finger point drag.
  // MUST be capture phase: several handlers stop the pointerup's propagation
  // (e.g. a tap on a route line selecting it), which kills the bubble before it
  // reaches window — the id then leaked and every following one-finger drag was
  // misread as multi-touch, i.e. dragging died for the rest of the session.
  // The capture phase completes before any bubble handler can interfere.
  useEffect(() => {
    const release = (event: PointerEvent) => {
      activePointersRef.current.delete(event.pointerId);
    };
    window.addEventListener('pointerup', release, { capture: true });
    window.addEventListener('pointercancel', release, { capture: true });
    return () => {
      window.removeEventListener('pointerup', release, { capture: true });
      window.removeEventListener('pointercancel', release, { capture: true });
    };
  }, []);

  const runTapAction = useCallback(
    (event: React.PointerEvent) => {
      if (isZoomingRef.current) return;

      if (
        isEditMode &&
        isPlacingProtectionPoints &&
        machine.currentStateName !== 'extendRoute'
      ) {
        const positionInImage = getPositionInImageFromMouse(
          svgRef,
          event,
          photoZoom,
        );
        const coord = getPercentagePosition(positionInImage);
        addProtectionPoint({ x: coord.x, y: coord.y, units: 'percentage' });
        return;
      }

      if (
        isEditMode &&
        isPlacingProtectionPoints &&
        machine.currentStateName === 'extendRoute'
      ) {
        machine.execute('finishRoute');
        const positionInImage = getPositionInImageFromMouse(
          svgRef,
          event,
          photoZoom,
        );
        const coord = getPercentagePosition(positionInImage);
        addProtectionPoint({ x: coord.x, y: coord.y, units: 'percentage' });
        return;
      }

      if (machine.currentStateName === 'extendRoute') {
        machine.execute('addPointToEnd', event);
        return;
      }

      if (machine.currentStateName === 'protectionPointMenu') {
        machine.execute('cancelPointMenu');
        return;
      }

      if (machine.currentStateName === 'pointMenu') {
        machine.execute('cancelPointMenu');
        return;
      }

      // In edit mode (no double-tap zoom) or with nothing selected, deselect
      // right away — there's no selection worth protecting from a zoom gesture.
      if (isEditMode || routeSelectedIndex === null) {
        machine.execute('cancelRouteSelection');
        return;
      }

      if (pendingDeselectRef.current) {
        clearTimeout(pendingDeselectRef.current);
        pendingDeselectRef.current = null;
      }

      const now = Date.now();
      if (now - lastBackgroundTapRef.current < DOUBLE_TAP_MS) {
        // Second tap of a double-tap: this is a zoom gesture, keep the route.
        lastBackgroundTapRef.current = 0;
        return;
      }
      lastBackgroundTapRef.current = now;

      // Defer the deselect: cancel it if a double-tap follows, and skip it if the
      // user selected a different route in the meantime.
      const indexAtSchedule = routeSelectedIndex;
      pendingDeselectRef.current = setTimeout(() => {
        pendingDeselectRef.current = null;
        if (routeSelectedIndexRef.current === indexAtSchedule) {
          machine.execute('cancelRouteSelection');
        }
      }, DOUBLE_TAP_MS);
    },
    [
      addProtectionPoint,
      isEditMode,
      isPlacingProtectionPoints,
      machine,
      getPercentagePosition,
      photoZoom,
      svgRef,
      isZoomingRef,
      routeSelectedIndex,
    ],
  );

  const {
    onPointerDown: onBackgroundPointerDown,
    onPointerUp: onBackgroundPointerUp,
  } = useBackgroundTap(svgRef, runTapAction);

  // Pointer moves fire far more often than the screen refreshes; coalescing
  // them to one update per animation frame keeps the preview line and point
  // dragging smooth (one re-render per frame instead of one per event).
  const processMove = useCallback(
    (move: { clientX: number; clientY: number; altKey: boolean }) => {
      if (!isEditMode) {
        setMousePosition(null);
        return;
      }
      const positionInImage = getPositionInImageFromMouse(
        svgRef,
        move,
        photoZoom,
      );

      const isMultiTouch = activePointersRef.current.size > 1;

      // Once the threshold is crossed (pointWasDraggedRef set below), the drag
      // keeps applying even if the pointer returns close to the start.
      const start = gestureStartRef.current;
      const dx = start ? move.clientX - start.x : 0;
      const dy = start ? move.clientY - start.y : 0;
      const hasDragIntent =
        pointWasDraggedRef.current ||
        dx * dx + dy * dy >= DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX;

      const pointGrabbed = isPointClickedRef.current || isPointClicked;
      const protectionGrabbed =
        isProtectionPointClickedRef.current || isProtectionPointClicked;

      if (
        protectionGrabbed &&
        protectionPointSelectedIndex !== null &&
        hasDragIntent &&
        !isZoomingRef.current &&
        !isMultiTouch
      ) {
        setMousePosition(null);
        setIsProtectionPointMoving(true);
        pointWasDraggedRef.current = true;

        const newCoordinate = getPercentagePosition(positionInImage);
        const closestPoint = findCloserPoint(newCoordinate, {
          excludeProtectionIndex: protectionPointSelectedIndex,
          disableSnap: move.altKey,
        });

        const updatedPoint = closestPoint ?? newCoordinate;
        updateProtectionPointPositionAtIndex(
          protectionPointSelectedIndex,
          updatedPoint,
          closestPoint ?? undefined,
        );
        return;
      }

      if (
        pointGrabbed &&
        hasDragIntent &&
        !isZoomingRef.current &&
        !isMultiTouch
      ) {
        setMousePosition(null);
        machine.execute('dragPoint', { position: positionInImage });
        setIsPointMoving(true);
        pointWasDraggedRef.current = true;

        const newCoordinate = getPercentagePosition(positionInImage);
        const closestPoint = findCloserPoint(newCoordinate, {
          disableSnap: move.altKey,
        });

        const updatedPoint = closestPoint ?? newCoordinate;
        updatePathOnRouteIndex(routeSelectedIndex, (path) =>
          updateElementOnIndex(path, pointSelectedIndex, (point) => ({
            ...point,
            x: updatedPoint.x,
            y: updatedPoint.y,
            ...(closestPoint?.type ? { type: closestPoint?.type } : {}),
          })),
        );
      } else if (machine.currentStateName !== 'extendRoute') {
        setMousePosition(null);
      } else if (routeIndexHovered === null) {
        setMousePosition(positionInImage);
      }
    },
    [
      isEditMode,
      findCloserPoint,
      getPercentagePosition,
      isPointClicked,
      isPointClickedRef,
      isProtectionPointClicked,
      isProtectionPointClickedRef,
      isZoomingRef,
      machine,
      photoZoom,
      pointSelectedIndex,
      pointWasDraggedRef,
      protectionPointSelectedIndex,
      routeIndexHovered,
      routeSelectedIndex,
      setIsPointMoving,
      setIsProtectionPointMoving,
      setMousePosition,
      svgRef,
      updatePathOnRouteIndex,
      updateProtectionPointPositionAtIndex,
    ],
  );

  const { schedule: scheduleMove, cancel: cancelMove } =
    useRafThrottle(processMove);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      scheduleMove({
        clientX: event.clientX,
        clientY: event.clientY,
        altKey: event.altKey,
      });
    },
    [scheduleMove],
  );

  const handleOnMovingPointDropped = useCallback(() => {
    // Drop any move still queued for the next frame so it can't re-apply a
    // drag (with now-stale state) after the point has already been released.
    cancelMove();

    // The grab must ALWAYS end on release — drag & drop is
    // press → move → release, nothing may survive the pointer going up.
    // Crucially this must not be gated on isPointMoving React state (as it
    // used to be): with a fast drag the pointerup fires before the rAF move's
    // setIsPointMoving(true) commits, the stale-false guard skipped the reset
    // and isPointClicked stayed on — the point then kept following the cursor
    // with no button held ("sticky drag" that needed a second click to drop).
    isPointClickedRef.current = false;
    isProtectionPointClickedRef.current = false;
    setIsPointClicked(false);
    setIsProtectionPointClicked(false);
    setIsPanningDisabled(false);

    // Selection teardown is only for actual drags (a plain click keeps the
    // selection for the point menu). pointWasDraggedRef is set synchronously
    // by the same code that applies drag moves, so unlike the isPointMoving
    // state it can't be stale here; the state checks are a backstop for state
    // left over from interrupted gestures (e.g. a drag broken by a pinch).
    if (
      pointWasDraggedRef.current ||
      isPointMoving ||
      isProtectionPointMoving
    ) {
      setPointSelectedIndex(null);
      setIsPointMoving(false);
      setProtectionPointSelectedIndex(null);
      setIsProtectionPointMoving(false);
    }
  }, [
    cancelMove,
    isPointClickedRef,
    isPointMoving,
    isProtectionPointClickedRef,
    isProtectionPointMoving,
    pointWasDraggedRef,
    setIsPanningDisabled,
    setIsPointClicked,
    setIsPointMoving,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
    setPointSelectedIndex,
    setProtectionPointSelectedIndex,
  ]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const isFirstPointer = activePointersRef.current.size === 0;
      activePointersRef.current.add(event.pointerId);

      // Fresh single-finger gesture: reset stale gesture flags so a new drag can
      // always start. In particular a pinch that ended without a clean
      // onPinchingStop could leave isZoomingRef stuck true, which then silently
      // blocks every later point drag — one finger landing is never a zoom, so
      // clearing it here self-heals that. Also reset the drag/tap marker.
      if (isFirstPointer) {
        pointWasDraggedRef.current = false;
        isZoomingRef.current = false;
        gestureStartRef.current = { x: event.clientX, y: event.clientY };
      }

      // A second pointer starts a pinch-zoom. Abort any point-drag intent from
      // the first finger right away, so neither the pinch itself nor the single
      // finger left after it ends keeps dragging the previously pressed point.
      if (activePointersRef.current.size > 1) {
        cancelMove();
        isPointClickedRef.current = false;
        isProtectionPointClickedRef.current = false;
        setIsPointClicked(false);
        setIsProtectionPointClicked(false);
      }

      onBackgroundPointerDown(event);
    },
    [
      cancelMove,
      isPointClickedRef,
      isProtectionPointClickedRef,
      isZoomingRef,
      onBackgroundPointerDown,
      pointWasDraggedRef,
      setIsPointClicked,
      setIsProtectionPointClicked,
    ],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      activePointersRef.current.delete(event.pointerId);
      onBackgroundPointerUp(event);
      // Release via pointer events (not onMouseUp) so touch drags are reliably
      // finalized — on touch devices the compatibility mouseup often never
      // arrives, which used to leave isPointClicked stuck on and let the next
      // stray touch drag the point.
      handleOnMovingPointDropped();
    },
    [onBackgroundPointerUp, handleOnMovingPointDropped],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent) => {
      activePointersRef.current.delete(event.pointerId);
      handleOnMovingPointDropped();
    },
    [handleOnMovingPointDropped],
  );

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerMove,
  };
};
