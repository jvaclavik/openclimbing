import React from 'react';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { useConfig } from '../config';

const NonEditablePoint = ({ x, y, isSelected }) => {
  const config = useConfig();
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={4}
        strokeWidth="0"
        fill={
          isSelected ? config.pathBorderColorSelected : config.pathBorderColor
        }
      />
      <circle
        cx={x}
        cy={y}
        r={2.5}
        strokeWidth="0"
        fill={
          isSelected ? config.pathStrokeColorSelected : config.pathStrokeColor
        }
      />
    </>
  );
};

type Props = {
  routeIndex: number;
};

/** View-mode marker for a route that has only its start point on this photo.
 * Editable handles live in RouteMarks — do not duplicate them here (overlapping
 * hit targets break touch dragging of the first point on mobile). */
export const StartPoint = ({ routeIndex }: Props) => {
  const {
    isRouteSelected,
    machine,
    getPixelPosition,
    getPathForRoute,
    routes,
  } = useClimbingContext();

  const route = routes[routeIndex];
  const path = getPathForRoute(route);
  if (!route || !path || path?.length === 0) return null;

  const isSelected = isRouteSelected(routeIndex);
  if (
    isSelected &&
    (machine.currentStateName === 'editRoute' ||
      machine.currentStateName === 'extendRoute')
  ) {
    return null;
  }

  const { x, y } = getPixelPosition({
    ...path[0],
    units: 'percentage',
  });

  return <NonEditablePoint isSelected={isSelected} x={x} y={y} />;
};
