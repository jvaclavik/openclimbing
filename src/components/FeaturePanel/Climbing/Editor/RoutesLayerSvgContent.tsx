import React from 'react';
import { useMobileMode } from '../../../helpers';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { RouteWithLabel } from './RouteWithLabel';
import { InteractivePath } from './InteractivePath';
import { RouteMarks } from './RouteMarks';
import { RouteNumber } from './RouteNumber';

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

      {routeIndexHovered != null && !isMobileMode ? (
        <>
          <RouteWithLabel routeIndex={routeIndexHovered} />
          <InteractivePath routeIndex={routeIndexHovered} allowHoverMidpoint />
        </>
      ) : null}

      {routeSelectedIndex != null ? (
        <>
          <RouteWithLabel routeIndex={routeSelectedIndex} />
          <InteractivePath routeIndex={routeSelectedIndex} />
        </>
      ) : null}

      {routes.map((_, routeIndex) => (
        <RouteMarks key={routeIndex} routeIndex={routeIndex} />
      ))}

      {routeSelectedIndex != null ? (
        <RouteMarks routeIndex={routeSelectedIndex} />
      ) : null}

      {/* Render all route number badges + grades on top of every path and
          mark, so they're never visually covered by another route's line. */}
      {routes.map((_, routeIndex) => (
        <RouteNumber key={routeIndex} routeIndex={routeIndex} />
      ))}

      {routeIndexHovered != null && !isMobileMode ? (
        <RouteNumber routeIndex={routeIndexHovered} />
      ) : null}

      {routeSelectedIndex != null ? (
        <RouteNumber routeIndex={routeSelectedIndex} />
      ) : null}
    </>
  );
};
