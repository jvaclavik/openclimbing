import React from 'react';
import { useMobileMode } from '../../../helpers';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { RouteWithLabel } from './RouteWithLabel';
import { InteractivePath } from './InteractivePath';
import { RouteMarks } from './RouteMarks';

export const RoutesLayerSvgContent = () => {
  const isMobileMode = useMobileMode();
  const { routes, routeSelectedIndex, routeIndexHovered } =
    useClimbingContext();

  return (
    <>
      {routes.map((_, routeIndex) => (
        <React.Fragment key={routeIndex}>
          <RouteWithLabel routeIndex={routeIndex} />
          <InteractivePath routeIndex={routeIndex} />
        </React.Fragment>
      ))}

      {routeSelectedIndex != null ? (
        <>
          <RouteWithLabel routeIndex={routeSelectedIndex} />
          <InteractivePath routeIndex={routeSelectedIndex} />
        </>
      ) : null}

      {routeIndexHovered != null && !isMobileMode ? (
        <>
          <RouteWithLabel routeIndex={routeIndexHovered} />
          <InteractivePath routeIndex={routeIndexHovered} allowHoverMidpoint />
        </>
      ) : null}

      {routes.map((_, routeIndex) => (
        <RouteMarks key={routeIndex} routeIndex={routeIndex} />
      ))}
    </>
  );
};
