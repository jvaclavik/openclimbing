import React, { useCallback } from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { updateElementOnIndex } from '../utils/array';
import { getPositionInImageFromMouse } from '../utils/mousePositionUtils';

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
    isAddingPointBlockedRef,
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

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isEditMode) return;
      if (isZoomingRef.current) return;

      if (
        isEditMode &&
        isPlacingProtectionPoints &&
        machine.currentStateName !== 'extendRoute' &&
        !isAddingPointBlockedRef.current
      ) {
        const positionInImage = getPositionInImageFromMouse(
          svgRef,
          event,
          photoZoom,
        );
        const coord = getPercentagePosition(positionInImage);
        addProtectionPoint({
          x: coord.x,
          y: coord.y,
          units: 'percentage',
        });
        return;
      }

      if (
        isEditMode &&
        isPlacingProtectionPoints &&
        machine.currentStateName === 'extendRoute' &&
        !isAddingPointBlockedRef.current
      ) {
        machine.execute('finishRoute');
        const positionInImage = getPositionInImageFromMouse(
          svgRef,
          event,
          photoZoom,
        );
        const coord = getPercentagePosition(positionInImage);
        addProtectionPoint({
          x: coord.x,
          y: coord.y,
          units: 'percentage',
        });
        return;
      }

      if (
        machine.currentStateName === 'extendRoute' &&
        !isAddingPointBlockedRef.current
      ) {
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

      if (!isAddingPointBlockedRef.current) {
        machine.execute('cancelRouteSelection');
      }
    },
    [
      addProtectionPoint,
      isAddingPointBlockedRef,
      isEditMode,
      isPlacingProtectionPoints,
      machine,
      getPercentagePosition,
      photoZoom,
      svgRef,
      isZoomingRef,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isEditMode) {
        setMousePosition(null);
        return;
      }
      const positionInImage = getPositionInImageFromMouse(
        svgRef,
        event,
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
          disableSnap: event.altKey,
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
          disableSnap: event.altKey,
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

  const handleOnMovingPointDropped = useCallback(() => {
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

  return { onClick, onPointerMove, handleOnMovingPointDropped };
};
