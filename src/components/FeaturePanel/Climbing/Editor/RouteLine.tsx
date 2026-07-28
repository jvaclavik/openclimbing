import { LineType, PositionPx } from '../types';
import React from 'react';
import { useMobileMode } from '../../../helpers';
import { useTapGesture } from './useTapGesture';

type RouteLineProps = {
  pathPx: PositionPx[];
  strokeWidth: number;
  stroke: string;
  opacity?: number;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onClick?: (e: React.MouseEvent, segmentIndex: number) => void;
  cursor?: string;
  pointerEvents?: React.SVGAttributes<SVGLineElement>['pointerEvents'];
};
export const RouteLine = ({
  pathPx,
  strokeWidth,
  stroke,
  opacity,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  onClick,
  cursor,
  pointerEvents,
}: RouteLineProps) => {
  const isMobileMode = useMobileMode();
  const { onPointerDown, endTap } = useTapGesture();

  const getLineDasharray = (previousLineType: LineType) => {
    if (previousLineType === 'dotted') {
      if (isMobileMode) {
        return '0.6 2.5';
      }
      return '0.3 5';
    }

    return undefined;
  };

  return (
    <>
      {pathPx.slice(0, -1).map((position1, segmentIndex) => {
        const position2 = pathPx[segmentIndex + 1];

        return (
          <line
            // eslint-disable-next-line react/no-array-index-key
            key={segmentIndex}
            stroke={stroke}
            strokeWidth={strokeWidth}
            x1={position1.x}
            y1={position1.y}
            x2={position2.x}
            y2={position2.y}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            onPointerDown={onClick ? onPointerDown : undefined}
            onPointerUp={
              onClick
                ? (e) => {
                    if (endTap(e)) onClick(e, segmentIndex);
                  }
                : undefined
            }
            cursor={cursor}
            pointerEvents={pointerEvents}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
            strokeDasharray={getLineDasharray(position2.previousLineType)}
          />
        );
      })}
    </>
  );
};
