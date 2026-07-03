import React, { useState, type TouchEventHandler } from 'react';
import styled from '@emotion/styled';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { useMobileMode } from '../../../helpers';
import { useProtectionPointClickHandler } from './utils';
import { PointType } from '../types';

const ClickableArea = styled.circle``;

const PointElement = styled.circle<{
  $isHovered: boolean;
  $isPointSelected: boolean;
}>`
  transition: all 0.1s ease-in-out;
  pointer-events: all;
  touch-action: none;
  ${({ $isHovered, $isPointSelected }) =>
    `${
      $isHovered || $isPointSelected
        ? 'transform: scale(1.5);'
        : 'transform: scale(1);'
    }`}
`;

const PROTECTION_POINT_YELLOW = '#ffd60a';

const usePointColor = (type: PointType | undefined) => {
  const invisiblePointsForTypes: PointType[] = [];

  if (type && invisiblePointsForTypes.includes(type))
    return { pointColor: 'transparent', pointStroke: 'transparent' };

  // Unfilled yellow circles.
  return {
    pointColor: 'transparent',
    pointStroke: PROTECTION_POINT_YELLOW,
  };
};

type Props = {
  x: number;
  y: number;
  index: number;
  isSelected: boolean;
  interactive: boolean;
  type?: PointType;
  /** Protection point that is not currently represented as a route node. */
  shouldHighlight: boolean;
};

export const ProtectionPointCenter = ({
  x,
  y,
  index,
  isSelected,
  interactive,
  type,
  shouldHighlight,
}: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    photoZoom,
    setIsPanningDisabled,
    setIsPointClicked,
    setProtectionPointSelectedIndex,
    setIsProtectionPointClicked,
  } = useClimbingContext();
  const isMobileMode = useMobileMode();
  const { pointColor, pointStroke } = usePointColor(type);
  const onPointMouseUp = useProtectionPointClickHandler();

  const onPointClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const onPointMouseEnter = () => {
    setIsHovered(true);
  };

  const onPointMouseLeave = () => {
    setIsHovered(false);
  };

  const onPointMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsPanningDisabled(true);
    setIsPointClicked(false);
    setIsProtectionPointClicked(true);
    setProtectionPointSelectedIndex(index);
    e.stopPropagation();
  };

  const commonProps = interactive
    ? {
        onMouseDown: onPointMouseDown,
        onMouseUp: onPointMouseUp,
        onTouchStart:
          onPointMouseDown as unknown as TouchEventHandler<SVGCircleElement>,
        onTouchEnd:
          onPointMouseUp as unknown as TouchEventHandler<SVGCircleElement>,
        onClick: onPointClick,
        cursor: 'pointer' as const,
        ...(isMobileMode
          ? {}
          : {
              onMouseEnter: onPointMouseEnter,
              onMouseLeave: onPointMouseLeave,
            }),
        cx: 0,
        cy: 0,
      }
    : {
        onClick: onPointClick,
        cx: 0,
        cy: 0,
      };

  const title = type ? <title>{type}</title> : null;
  const isTouchDevice = 'ontouchstart' in window;
  const pointRadius = shouldHighlight ? 12 : 8;
  const highlightRingRadius = shouldHighlight ? 16 : 0;

  return (
    <g transform={`translate(${x},${y}) scale(${1 / photoZoom.scale})`}>
      {interactive ? (
        <>
          <ClickableArea
            fill="transparent"
            r={isTouchDevice ? 20 : 16}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...commonProps}
          >
            {title}
          </ClickableArea>
          {shouldHighlight ? (
            <circle
              cx={0}
              cy={0}
              r={highlightRingRadius}
              fill="transparent"
              stroke={pointStroke}
              strokeWidth={1.5}
              opacity={0.5}
              pointerEvents="none"
            />
          ) : null}
          <PointElement
            fill={pointColor}
            stroke={pointStroke}
            strokeWidth={2}
            r={pointRadius}
            $isHovered={isHovered}
            $isPointSelected={isSelected}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...commonProps}
          >
            {title}
          </PointElement>
        </>
      ) : (
        <>
          {shouldHighlight ? (
            <circle
              cx={0}
              cy={0}
              r={highlightRingRadius}
              fill="transparent"
              stroke={pointStroke}
              strokeWidth={1.5}
              opacity={0.5}
              pointerEvents="none"
            />
          ) : null}
          <PointElement
            fill={pointColor}
            stroke={pointStroke}
            strokeWidth={2}
            r={pointRadius}
            $isHovered={false}
            $isPointSelected={isSelected}
            cx={0}
            cy={0}
          >
            {title}
          </PointElement>
        </>
      )}
    </g>
  );
};
