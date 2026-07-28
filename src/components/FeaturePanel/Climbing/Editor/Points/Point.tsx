import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useClimbingContext } from '../../contexts/ClimbingContext';
import { useConfig } from '../../config';
import { useMobileMode } from '../../../../helpers';
import { PANNING_EXCLUDED_CLASS, usePointClickHandler } from '../utils';
import { PointType } from '../../types';

// The big invisible grab target is where a touch drag starts, so it must opt
// out of the browser's default touch gestures. Without this the browser reads
// the finger drag as a scroll/pan and fires pointercancel — which killed the
// drag before the point could move (the point was disabled from panning, so
// react-zoom-pan-pinch doesn't preventDefault to keep the gesture alive).
const ClickableArea = styled.circle`
  touch-action: none;
`;

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

const usePointColor = (type, isHovered) => {
  const config = useConfig();
  const invisiblePointsForTypes = [];

  if (invisiblePointsForTypes.includes(type))
    return { pointColor: 'transparent', pointStroke: 'transparent' };

  if (isHovered)
    return {
      pointColor: config.pathBorderColor,
      pointStroke: config.pathBorderColorSelected,
    };

  return {
    pointColor: config.pathBorderColor,
    pointStroke: config.pathBorderColorSelected,
  };
};

type Props = {
  routeIndex: number;
  index: number;
  type: PointType;
  x: number;
  y: number;
};

export const Point = ({ x, y, type, index, routeIndex }: Props) => {
  const [isHovered, setIsHovered] = useState(false);
  const {
    setPointSelectedIndex,
    setIsPointClicked,
    setIsProtectionPointClicked,
    setRouteIndexHovered,
    photoZoom,
    getCurrentPath,
    setIsPanningDisabled,
    isRouteSelected,
    isPointSelected,
    isOtherRouteSelected,
    isEditMode,
  } = useClimbingContext();
  const isMobileMode = useMobileMode();
  const isSelected = isRouteSelected(routeIndex);
  const isOtherSelected = isOtherRouteSelected(routeIndex);
  const { pointColor, pointStroke } = usePointColor(type, isHovered);

  const isPointOnRouteSelected = isSelected && isPointSelected(index);

  const onPointClick = (e) => {
    e.stopPropagation();
  };

  const onPointMouseEnter = () => {
    setIsHovered(true);
    const isLastPoint = getCurrentPath().length - 1 === index;
    if (!isLastPoint) {
      setRouteIndexHovered(routeIndex);
    }
  };

  const onPointMouseLeave = () => {
    setIsHovered(false);
    setRouteIndexHovered(null);
  };

  const onPointMouseDown = (e) => {
    setIsPanningDisabled(true);
    setIsProtectionPointClicked(false);
    setPointSelectedIndex(index);
    setIsPointClicked(true);
    e.stopPropagation();
  };

  const onPointMouseUp = usePointClickHandler(index);
  const isTouchDevice = 'ontouchstart' in window;

  const commonProps = {
    className: PANNING_EXCLUDED_CLASS,
    onMouseDown: onPointMouseDown,
    onMouseUp: onPointMouseUp,
    onTouchStart: onPointMouseDown,
    onTouchEnd: onPointMouseUp,
    onClick: onPointClick,
    cursor: 'pointer',
    ...(isMobileMode
      ? {}
      : {
          onMouseEnter: onPointMouseEnter,
          onMouseLeave: onPointMouseLeave,
        }),
    cx: 0,
    cy: 0,
  };
  const title = type && <title>{type}</title>;

  if (isOtherSelected && isEditMode)
    return (
      <g transform={`translate(${x},${y}) scale(${1 / photoZoom.scale})`}>
        {/* Purely a marker for other routes — must not intercept pointer taps,
            otherwise it blocks selecting that route via the line beneath it. */}
        <circle
          cx={0}
          cy={0}
          r={2.5 * photoZoom.scale}
          fill="white"
          pointerEvents="none"
        />
      </g>
    );
  if (!isSelected || !isEditMode) return null;

  return (
    <g transform={`translate(${x},${y}) scale(${1 / photoZoom.scale})`}>
      <ClickableArea
        fill="transparent"
        r={isTouchDevice ? 24 : 10}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...commonProps}
      >
        {title}
      </ClickableArea>

      <PointElement
        fill={pointColor}
        stroke={pointStroke}
        r={4}
        $isHovered={isHovered}
        $isPointSelected={isPointOnRouteSelected}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...commonProps}
      >
        {title}
      </PointElement>
    </g>
  );
};
