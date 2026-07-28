import React from 'react';
import { Bolt } from './Points/Bolt';
import { Piton } from './Points/Piton';
import { Point } from './Points/Point';
import { PulsedPoint } from './Points/PulsedPoint';
import { Sling } from './Points/Sling';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { Anchor } from './Points/Anchor';
import { UnfinishedPoint } from './Points/UnfinishedPoint';
import { useShowProtectionPoints } from '../utils/useShowProtectionPoints';

type Props = {
  routeIndex: number;
};

export const RouteMarks = ({ routeIndex }: Props) => {
  const {
    getPixelPosition,
    isPointSelected,
    machine,
    getPathForRoute,
    isRouteSelected,
    isOtherRouteSelected,
    isEditMode,
    routes,
  } = useClimbingContext();
  const showProtectionPoints = useShowProtectionPoints();
  const isSelected = isRouteSelected(routeIndex);
  const isOtherSelected = isOtherRouteSelected(routeIndex);
  const route = routes[routeIndex];
  const path = getPathForRoute(route);

  // The gear symbols along a route are "protection on the photo" too, so they
  // honor the same setting. While editing we always show them so points stay
  // manipulable regardless of the viewing preference.
  const showGear = isEditMode || showProtectionPoints;

  return (
    <>
      {path.map(({ x, y, type }, index) => {
        const isBoltVisible = showGear && !isOtherSelected && type === 'bolt';
        const isAnchorVisible =
          showGear && !isOtherSelected && type === 'anchor';
        const isSlingVisible = showGear && !isOtherSelected && type === 'sling';
        const isPitonVisible = showGear && !isOtherSelected && type === 'piton';
        const isUnfinishedPointVisible =
          showGear && !isOtherSelected && type === 'unfinished';

        const position = getPixelPosition({ x, y, units: 'percentage' });
        const isActualPointSelected = isSelected && isPointSelected(index);
        const pointerEvents = isSelected || isEditMode ? 'auto' : 'none';
        const isThisRouteEditOrExtendMode =
          (machine.currentStateName === 'extendRoute' ||
            machine.currentStateName === 'pointMenu' ||
            machine.currentStateName === 'editRoute') &&
          isSelected;

        const xOffset = isSelected && isEditMode ? 15 : 0;
        return (
          // The key must NOT include x/y: while dragging a point its
          // coordinates change every move, so a coordinate-based key would
          // remount the point's DOM node on every frame. On touch that
          // destroys the node holding the pointerdown's implicit pointer
          // capture, which fires a spurious `pointercancel` — and our
          // SVG-level onPointerCancel then aborts the drag after the first
          // pixel (finger dragging "doesn't work"). A stable key keeps the
          // node alive for the whole gesture (and avoids needless remounts).
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={`${routeIndex}-${index}`}>
            {isThisRouteEditOrExtendMode && <PulsedPoint x={x} y={y} />}

            {isBoltVisible && (
              <Bolt
                x={position.x + xOffset}
                y={position.y}
                isPointSelected={isActualPointSelected}
                pointerEvents={pointerEvents}
                pointIndex={index}
              />
            )}
            {isPitonVisible && (
              <Piton
                x={position.x + xOffset}
                y={position.y}
                isPointSelected={isActualPointSelected}
                pointerEvents={pointerEvents}
                pointIndex={index}
              />
            )}
            {isSlingVisible && (
              <Sling
                x={position.x}
                y={position.y}
                isPointSelected={isActualPointSelected}
                pointerEvents={pointerEvents}
                pointIndex={index}
              />
            )}
            {isAnchorVisible && (
              <Anchor
                x={position.x + xOffset}
                y={position.y}
                isPointSelected={isActualPointSelected}
                pointerEvents={pointerEvents}
                pointIndex={index}
              />
            )}
            {isUnfinishedPointVisible && (
              <UnfinishedPoint
                x={position.x + xOffset}
                y={position.y}
                isPointSelected={isActualPointSelected}
                pointerEvents={pointerEvents}
                pointIndex={index}
              />
            )}
            <Point
              x={position.x}
              y={position.y}
              type={type}
              index={index}
              routeIndex={routeIndex}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
