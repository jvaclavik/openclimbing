import React, { useCallback } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { useRafThrottle } from './useRafThrottle';
import { updateElementOnIndex } from '../utils/array';
import { getPositionInImageFromMouse } from '../utils/mousePositionUtils';
import { useBackgroundTap } from './useBackgroundTap';

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

      machine.execute('cancelRouteSelection');
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
    ],
  );

  const { onPointerDown, onPointerUp } = useBackgroundTap(svgRef, runTapAction);

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

      if (
        isProtectionPointClicked &&
        protectionPointSelectedIndex !== null &&
        !isZoomingRef.current
      ) {
        setMousePosition(null);
        setIsProtectionPointMoving(true);

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

      if (isPointClicked && !isZoomingRef.current) {
        setMousePosition(null);
        machine.execute('dragPoint', { position: positionInImage });
        setIsPointMoving(true);

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
      isProtectionPointClicked,
      isZoomingRef,
      machine,
      photoZoom,
      pointSelectedIndex,
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
    (event: React.MouseEvent) => {
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

    if (isZoomingRef.current) {
      return;
    }
    if (isPointMoving) {
      setPointSelectedIndex(null);
      setIsPointMoving(false);
      setIsPointClicked(false);
      setIsPanningDisabled(false);
    }
    if (isProtectionPointMoving) {
      setProtectionPointSelectedIndex(null);
      setIsProtectionPointMoving(false);
      setIsProtectionPointClicked(false);
      setIsPanningDisabled(false);
    }
  }, [
    cancelMove,
    isPointMoving,
    isProtectionPointMoving,
    isZoomingRef,
    setIsPanningDisabled,
    setIsPointClicked,
    setIsPointMoving,
    setIsProtectionPointClicked,
    setIsProtectionPointMoving,
    setPointSelectedIndex,
    setProtectionPointSelectedIndex,
  ]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    handleOnMovingPointDropped,
  };
};
