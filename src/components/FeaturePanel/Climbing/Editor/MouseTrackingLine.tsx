import React, { useEffect, useState } from 'react';
import { PathWithBorder } from './PathWithBorder';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { PositionPx } from '../types';

type Props = {
  routeIndex: number;
};

export const MouseTrackingLine = ({ routeIndex }: Props) => {
  const {
    mousePosition,
    isRouteSelected,
    getPixelPosition,
    getPercentagePosition,
    routes,
    findCloserPoint,
    getPathForRoute,
  } = useClimbingContext();

  const [isAltDown, setIsAltDown] = useState(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const closerMousePositionPoint = mousePosition
    ? findCloserPoint(getPercentagePosition(mousePosition), {
        disableSnap: isAltDown,
      })
    : null;
  const mousePositionSticked = closerMousePositionPoint
    ? getPixelPosition(closerMousePositionPoint)
    : mousePosition;

  const isSelected = isRouteSelected(routeIndex);

  if (!mousePositionSticked || !isSelected) return null;

  const route = routes[routeIndex];
  const path = getPathForRoute(route);
  const lastPoint = path[path.length - 1];
  const lastPointPositionInPx = getPixelPosition(lastPoint);

  const startPoint: PositionPx = {
    x: lastPointPositionInPx.x,
    y: lastPointPositionInPx.y,
    units: 'px',
  };

  const endPoint: PositionPx = {
    x: mousePositionSticked.x,
    y: mousePositionSticked.y,
    units: 'px',
  };
  const points = [
    getPercentagePosition(startPoint),
    getPercentagePosition(endPoint),
  ];

  return <PathWithBorder path={points} routeIndex={routeIndex} opacity={0.7} />;
};
