import React from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { Bolt } from './Points/Bolt';
import { Piton } from './Points/Piton';
import { Sling } from './Points/Sling';
import { Anchor } from './Points/Anchor';
import { UnfinishedPoint } from './Points/UnfinishedPoint';
import { PointType } from '../types';
import { ProtectionPointCenter } from './ProtectionPointCenter';
import { getStickyThreshold } from '../utils/findCloserPoint';

export const ProtectionPointsLayer = () => {
  const {
    getPixelPosition,
    getProtectionPointsForCurrentPhoto,
    getCurrentPath,
    isEditMode,
    machine,
    protectionPointSelectedIndex,
  } = useClimbingContext();

  const points = getProtectionPointsForCurrentPhoto();
  if (points.length === 0) {
    return null;
  }

  const routePoints = getCurrentPath();
  const threshold = getStickyThreshold();
  const thresholdSq = threshold ** 2;

  const isOnAnyRoutePoint = (p: { x: number; y: number }) =>
    routePoints.some(
      (rp) => (rp.x - p.x) ** 2 + (rp.y - p.y) ** 2 <= thresholdSq,
    );

  const blockProtectionPointer =
    machine.currentStateName === 'extendRoute' ||
    machine.currentStateName === 'pointMenu';

  const canInteract = isEditMode && !blockProtectionPointer;

  const pointerEvents = canInteract ? 'auto' : 'none';

  const xOffset = 15;

  return (
    <g style={{ pointerEvents }}>
      {points.map(({ x, y, type }, index) => {
        const position = getPixelPosition({ x, y, units: 'percentage' });
        const isSelected = protectionPointSelectedIndex === index;
        const pointType = type as PointType | undefined;

        const iconProps = {
          isPointSelected: isSelected,
          pointerEvents: 'none' as const,
          pointIndex: 0,
        };

        return (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={`protection-${index}-${x}-${y}`}>
            {pointType === 'bolt' && (
              <Bolt x={position.x + xOffset} y={position.y} {...iconProps} />
            )}
            {pointType === 'piton' && (
              <Piton x={position.x + xOffset} y={position.y} {...iconProps} />
            )}
            {pointType === 'sling' && (
              <Sling x={position.x} y={position.y} {...iconProps} />
            )}
            {pointType === 'anchor' && (
              <Anchor x={position.x + xOffset} y={position.y} {...iconProps} />
            )}
            {pointType === 'unfinished' && (
              <UnfinishedPoint
                x={position.x + xOffset}
                y={position.y}
                {...iconProps}
              />
            )}
            <ProtectionPointCenter
              x={position.x}
              y={position.y}
              index={index}
              isSelected={isSelected}
              interactive={canInteract}
              type={pointType}
              shouldHighlight={!isOnAnyRoutePoint({ x, y })}
            />
          </React.Fragment>
        );
      })}
    </g>
  );
};
